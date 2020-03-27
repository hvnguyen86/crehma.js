const http = require('http')
const CREHMA = require("./CREHMA.js");
const CREHMAResponse = require("./CREHMAResponse.js");
const CREHMARequest = require("./CREHMARequest.js")
const base64Key = "fJW7ebII2E4RU3fD4BjixIDnV++0mq8LUY5TMx2C/g5nRDDies4AFLZ939sU1uoMH+uey1xUMKVSFCd+VNXg+4yOS1M/DtM+9ObW108iNmlXZQsKgXLkRLrBkZ78y2r8Mml3WXe14ktXjCjhRXTx5lBsTKMEcBTxepe1aQ+0hLNOUDhsUKr31t9fS5/9nAQC7s9sPln54Oic1pnDOIfnBEku/vPl3zQCMtU2eRk9v+AfschSUGOvLV6Ctg0cGuSi/h8oKZuUYXrjoehUo1gBvZLVBpcCxZt1/ySGTInLic3QbfZwlT5sJKrYvfHXjANOEIM7JZMaSnfMdK2R9OJJpw=="
const key = Buffer.from(base64Key,'base64');
const kid = "jCREHMAKey";

var SHA256 = require("./SHA256.js");
var HMACSHA256 = require("./HMACSHA256.js");

const c = new CREHMA()
const tbsResponseHeaders = c.getTbsResponseHeaders();
const tbsRequestHeaders = c.getTbsRequestHeaders();

var signatureAlgorithm = new HMACSHA256();
signatureAlgorithm.setKey(kid,key);

var hashAlgorithm = new SHA256();

c.addSignatureAlgorithm(signatureAlgorithm.getName(),signatureAlgorithm);
c.addHashAlgorithm(hashAlgorithm.getName(),hashAlgorithm)


var options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Host': "localhost:3000",
    "X-Header":"test",
    "Y-Header": "test2"
  }
}

var addHeaders = "X-Header;Y-Header";


var crehmaReq = new CREHMARequest(options.method, options.path)


for (var header in options.headers) {
  crehmaReq.setHeader(header,options.headers[header])
}

options.headers["Signature"] = c.generateSignatureHeaderRequest(crehmaReq,kid,addHeaders,signatureAlgorithm.getName(),hashAlgorithm.getName())

var crehma_res;
const req = http.request(options, (res) => {

crehma_res = new CREHMAResponse(res.statusCode);

for (var header in res.headers){
  crehma_res.setHeader(header,res.headers[header])
}


res.on('data', (d) => {
    process.stdout.write(d)
    crehma_res.setBody(d);
    console.log(c.verifyResponse(crehma_res,crehmaReq));
  })
})

req.on('error', (error) => {
  //console.error(error)
})

req.end()