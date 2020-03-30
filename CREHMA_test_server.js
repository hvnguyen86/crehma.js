const http = require('http');
const fs = require("fs")
const crypto = require("crypto")
const CREHMA = require("./CREHMA.js");
const CREHMAResponse = require("./CREHMAResponse.js");
const CREHMARequest = require("./CREHMARequest.js");
const SimpleETagGenerator = require("./SimpleETagGenerator.js");
const path = require('path');
const url = require('url');
var SHA256 = require("./SHA256.js");
var HMACSHA256 = require("./HMACSHA256.js");


const base64Key = "fJW7ebII2E4RU3fD4BjixIDnV++0mq8LUY5TMx2C/g5nRDDies4AFLZ939sU1uoMH+uey1xUMKVSFCd+VNXg+4yOS1M/DtM+9ObW108iNmlXZQsKgXLkRLrBkZ78y2r8Mml3WXe14ktXjCjhRXTx5lBsTKMEcBTxepe1aQ+0hLNOUDhsUKr31t9fS5/9nAQC7s9sPln54Oic1pnDOIfnBEku/vPl3zQCMtU2eRk9v+AfschSUGOvLV6Ctg0cGuSi/h8oKZuUYXrjoehUo1gBvZLVBpcCxZt1/ySGTInLic3QbfZwlT5sJKrYvfHXjANOEIM7JZMaSnfMdK2R9OJJpw=="
const key = Buffer.from(base64Key,'base64');
const kid = "jCREHMAKey";
var addHeaders = "null"

const c = new CREHMA()

const tbsResponseHeaders = c.getTbsResponseHeaders();
const tbsRequestHeaders = c.getTbsRequestHeaders();
var tbsWithoutTvpStore = {}
var signatureAlgorithm = new HMACSHA256();
signatureAlgorithm.setKey(kid,key);

var hashAlgorithm = new SHA256();

const eTagGenerator = new SimpleETagGenerator()

c.addSignatureAlgorithm(signatureAlgorithm.getName(),signatureAlgorithm);
c.addHashAlgorithm(hashAlgorithm.getName(),hashAlgorithm);
c.setETagGenerator(eTagGenerator)

const requestListener = function (req, res) {
	if(req.url.startsWith("/favicon")){
		res.statusCode = 404;
		return;
	} else if(req.url.startsWith("/browser")){
		// parse URL
		const parsedUrl = url.parse(req.url);
		// extract URL path
		var pathname = `.${parsedUrl.pathname}`;
		// maps file extention to MIME types
		const mimeType = {
		'.ico': 'image/x-icon',
		'.html': 'text/html',
		'.js': 'text/javascript',
		'.json': 'application/json',
		'.css': 'text/css',
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.wav': 'audio/wav',
		'.mp3': 'audio/mpeg',
		'.svg': 'image/svg+xml',
		'.pdf': 'application/pdf',
		'.doc': 'application/msword',
		'.eot': 'appliaction/vnd.ms-fontobject',
		'.ttf': 'aplication/font-sfnt'
		};
		fs.exists(pathname, function (exist) {
			if(!exist) {
			  // if the file is not found, return 404
			  res.statusCode = 404;
			  return;
			}
			// if is a directory, then look for index.html
			if (fs.statSync(pathname).isDirectory()) {
			  pathname += '/index.html';
			}
			// read file from file system
			fs.readFile(pathname, function(err, data){
				if(err){
					res.statusCode = 500;
					res.end("Error getting the file: ${err}.");
				} else {
				// based on the URL path, extract the file extension. e.g. .js, .doc, ...
					const ext = path.parse(pathname).ext;
					// if the file is found, set Content-type and send data
					res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
					res.end(data);
				}
			});
		});
	} else {
	 	// Convert node request to CREHMARequest to verify signature
		var crehmaReq = new CREHMARequest(req.method,req.url);

		
		for (var header in req.headers ){
			crehmaReq.setHeader(header, req.headers[header])
		}
		var requestSignatureVerificationResult = c.verifyRequest(crehmaReq);

		var body = "";
		if (!requestSignatureVerificationResult.validity){
			res.statusCode = 403;
			body = requestSignatureVerificationResult.reason + " " + new Date().getTime() + "\n";
		// Assuming that each conditional request is successful
		} else if(req.headers["if-none-match"]) {
			var etagRequest = req.headers["if-none-match"];
			var tbsWithoutTvp = tbsWithoutTvpStore[etagRequest];
			if(tbsWithoutTvp){
				res.setHeader("Validation-Signature",c.generateSignatureHeader304Response(tbsWithoutTvp,kid,signatureAlgorithm.getName(),hashAlgoritm.getName()));
				res.statusCode = 304;
				res.setHeader("ETag",etagRequest);
			}
				
		} else {
			res.statusCode = 200;
			body = "Valid Request Signature " + new Date().getTime() + "\n";
	 		res.setHeader("Content-Type","text/plain");
	 		res.setHeader("Cache-Control","max-age=3600")
		}

		res.setHeader("Content-Length",body.length)
		var crehmaRes = new CREHMAResponse(res.statusCode);
		crehmaRes.setBody(body);

		for (var i = 0; i < tbsResponseHeaders.length; i++) {
			
			crehmaRes.setHeader(tbsResponseHeaders[i], res.getHeader(tbsResponseHeaders[i]));
		};

		const {signatureHeaderValue, etag, tvpWithoutTvp} = c.generateSignatureHeaderResponse(crehmaRes,crehmaReq,kid,addHeaders,signatureAlgorithm.getName(),hashAlgorithm.getName());
		
		tbsWithoutTvpStore[etag] = tvpWithoutTvp;
		res.setHeader("Signature",signatureHeaderValue);
		res.setHeader("ETag",etag);
		res.end(body);
	}
	
}

function generateETag(data){
	hashOfBody = base64url.fromBase64(crypto.createHash('sha256').update(body).digest('base64'));
	return base64url.fromBase64(crypto.createHash('sha256').update(hashOfBoy + Date.getTime()).digest('base64')).substring(0,10); 
}

const server = http.createServer(requestListener);
server.listen(3000);