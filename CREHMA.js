signature_header_template = "sig=%s,hash=%s,kid=%s,tvp=%s,addHeaders=%s,sv=%s"
methods_with_empty_body = ["GET","HEAD","DELETE"]


module.exports = CREHMA;

function CREHMA(){
	this.etagGenerator = {}
	this.verifiedSignatures = []
	this.tbsRequestHeaders = ["Host","Accept","Content-Type","Transfer-Encoding","Content-Length"].sort()
	this.tbsResponseHeaders = ["Content-Type","Content-Length","Transfer-Encoding","Cache-Control","Expires","ETag","Last-Modified"].sort();
	this.tbsWithoutTvpStore = {}
	this.signatureAlgorithms = {};
	this.hashAlgorithms = {};
}

CREHMA.prototype.getTbsRequestHeaders = function (){
	return this.tbsRequestHeaders;
}

CREHMA.prototype.getTbsResponseHeaders = function (){
	return this.tbsResponseHeaders;
}


CREHMA.prototype.signRequest = function(req,kid,addHeaders,sig,hash){
	var tvp = new Date().toISOString();
	var tbs = this.buildTbsRequest(req,tvp,addHeaders,hash);
	var sv = this.getSignatureAlgorithm(sig).sign(tbs,kid,sig)
	var signaturHeaderValue = sprintf(signature_header_template, sig, hash, kid, tvp, addHeaders, sv)

	req.setHeader("Signature",signaturHeaderValue);

	return req;

}

CREHMA.prototype.generateSignatureHeaderRequest = function(req,kid,addHeaders,sig,hash){
	var tvp = new Date().toISOString();
	var tbs = this.buildTbsRequest(req,tvp,addHeaders,hash);
	var sv = this.getSignatureAlgorithm(sig).sign(tbs,kid,sig);

	return sprintf(signature_header_template, sig, hash, kid, tvp, addHeaders, sv);
}


CREHMA.prototype.signResponse = function(res,req,kid,addHeaders,sig,hash) {
	
	var tvp = new Date().toISOString();
		
	var primaryCacheKey = req.getMethod() + " " + req.getHeader("Host") + req.getTarget()
	var tbs = tvp + "\n" + this.buildTbsResponseWithoutTvp(res,primaryCacheKey,addHeaders,hash)
	var sv = this.getSignatureAlgorithm(sig).sign(tbs,kid);
	var signaturHeaderValue = sprintf(signature_header_template, sig, hash, kid, tvp, addHeaders, sv)
	res.setHeader("Signature",signaturHeaderValue);

	return res;

}

CREHMA.prototype.generateSignatureHeaderResponse = function(res,req,kid,addHeaders,sig,hash){
	var tvp = new Date().toISOString();
	var etag = this.generateETag(res.getBody());
	res.setHeader("ETag",etag);
	var primaryCacheKey = req.getMethod() + " " + req.getHeader("Host") + req.getTarget()
	var tbsWithoutTvp = this.buildTbsResponseWithoutTvp(res,primaryCacheKey,addHeaders,hash);
	var tbs = tvp + "\n" + tbsWithoutTvp;
	var sv = this.getSignatureAlgorithm(sig).sign(tbs,kid);
	return {signatureHeaderValue: sprintf(signature_header_template, sig, hash, kid, tvp, addHeaders, sv), etag: etag, tbsWithoutTvp: tbsWithoutTvp}
}

CREHMA.prototype.generateSignatureHeader304Response = function(tbsWithoutTvp,kid,sig,hash){
	var tvp = new Date().toISOString();
	var tbs = tvp + "\n" + tbsWithoutTvp;
	var sv = this.getSignatureAlgorithm(sig).sign(tbs,kid);
	return sprintf(signature_header_template, sig, hash, kid, tvp, addHeaders, sv);
}


CREHMA.prototype.generateETag = function(body){
	return this.eTagGenerator.generateETag(body)
}


CREHMA.prototype.verifyResponse = function(res,req){
	var result = {}
	if(res.getHeader("Signature")){
		const {sig, hash, sv, tvp, addHeaders, kid} = this.parseSignatureHeader(res.getHeader("Signature"));
		const tvpDate = Date.parse(tvp);
		if(isNaN(tvpDate)){
			result.validity = false;
			result.reason = "Invalid tvp";
			return result;
		}

		if(this.getHashAlgorithm(hash) == undefined){
			result.validity = false;
			result.reason =  "Unsupported Hash Algorithm";
			return result;
		}

		const method = req.getMethod();
		const primaryCacheKey = req.getMethod() +" "+ req.getHeader("Host") + req.getTarget();
		const tbs = tvp + "\n" + this.buildTbsResponseWithoutTvp(res,primaryCacheKey,addHeaders,hash);
		const signatureAlgorithm = this.getSignatureAlgorithm(sig);

		if(signatureAlgorithm == undefined){
			result.validity = false;
			result.reason =  "Unsupported Signature Algorithm";
			return result;
		}

		if(signatureAlgorithm.getKey(kid) == undefined){
			result.validity = false;
			result.reason = "Invalid Key Id";
			return result;
		}
		
		const signatureValidity = signatureAlgorithm.verify(tbs,sv,kid);
		console.log(signatureValidity);
		if(!signatureValidity){
			result.validity = false;
			result.reason = "Invalid Signature";
			return result;
		}

		const signatureFreshness = this.verifySignatureFreshness(res,tvpDate);

		if(!signatureFreshness){
			result.validity = false;
			result.reason = "Invalid Signature Freshness";
			return result;
		}

		this.verifiedSignatures.push(sv);

		result.validity = true;
		result.reason = "Valid Signature";
		return result;

	} else {
		result.validity = false
		result.reason  = "No Signature Header";
		return result;
	}


	
}

CREHMA.prototype.verifyRequest = function(req){
	var result = {}
	if(req.getHeader("Signature")){
		const {sig, hash, sv, tvp, addHeaders, kid} = this.parseSignatureHeader(req.getHeader("Signature"));
		
		if(this.verifiedSignatures.includes(sv)){
			result.validity = false;
			result.reason = "Duplicate Signature"
			return result
		}
		const signatureAlgorithm = this.getSignatureAlgorithm(sig);
		if(signatureAlgorithm == undefined){
			result.validity = true;
			result.reason = "Unsupported Signature Algorithm"
			return result;
		}
		const tbv = this.buildTbsRequest(req,tvp,addHeaders,hash);
		if(signatureAlgorithm.verify(tbs,sv,kid)){
			this.verifiedSignatures.push(sv);
			result.validity = true;
			result.reason = "Valid Signature"
			return result;
		} else {
			result.validity = false;
			result.reason = "Invalid Signature"
			return result;
		}
	} else {
		result.validity = false
		result.reason ="No Signature Header"
		return result;
	}
	

}

CREHMA.prototype.verifySignatureFreshness = function (res,tvpDate){
	if(res.getHeader("Cache-Control")){
		var maxAge = 0;
		var sMaxAge = 0;
		const cacheControlParams = res.getHeader("Cache-Control").split(",")
		for (var i = 0; i < cacheControlParams.length; i++) {
			if(cacheControlParams[i].startsWith("max-age=")){
				maxAge = cacheControlParams[i].split("=")[1]
			} else if(cacheControlParams[i].startsWith("s-maxage=")){
				sMaxAge = cacheControlParams[i].split("=")[1]
			}
		}

		const signatureFrehnessMaxAge = this.verifySignatureFreshnessMaxAge(maxAge,tvpDate);
		const signatureFresnessSMaxAge = this.verifySignatureFreshnessMaxAge(sMaxAge,tvpDate);
		return signatureFrehnessMaxAge || signatureFresnessSMaxAge
	} else if (res.getHeader("Expires")){
		const expiresDate = Date.parse(res.getHeader("Expires"));
		if(isNaN(expiresDate)){
			return false;
		}

		return tvpDate < expiresDate ? true : false
	}
	return true;
}

CREHMA.prototype.verifySignatureFreshnessMaxAge = function(maxAge,tvpDate){

	const now = Date.getTime();
	const signatureExpirationDate = tvpDate + 5000 + parseInt(maxAge) * 1000;
	return now < signatureExpirationDate ? true : false
}

CREHMA.prototype.buildTbsResponseWithoutTvp = function(res,primaryCacheKey,addHeaders,hash){
	var tbsWithoutTvp = primaryCacheKey + "\n";
	tbsWithoutTvp += "HTTP/" + res.getVersion() + "\n";
	tbsWithoutTvp += res.statusCode + "\n";
	var tbsResponseHeaders = this.tbsResponseHeaders.concat(addHeaders.split(";"));
	tbsResponseHeaders.sort()
	for (var i = 0; i < tbsResponseHeaders.length; i++) {

		if(res.getHeader(tbsResponseHeaders[i])){
			tbsWithoutTvp += res.getHeader(tbsResponseHeaders[i].toLowerCase()) + "\n";
		} else {
			tbsWithoutTvp += "\n"
		}
		
	}
	if (res.getBody()){
		tbsWithoutTvp += this.getHashAlgorithm(hash).generateHash(res.getBody())
	} else {
		tbsWithoutTvp += this.getHashAlgorithm(hash).getHashOfEmptyBody()
	}

	return tbsWithoutTvp;
}



CREHMA.prototype.buildTbsRequest = function(req,tvp,addHeaders,hash){
	tbs = tvp + "\n"
	tbs +=  req.getMethod() + "\n"
	tbs +=  req.getTarget() ? "/" : req.getTarget() + "\n"
	tbs +=  "HTTP/" + req.getVersion()  + "\n"

	var tbsRequestHeaders = this.tbsRequestHeaders.concat(addHeaders.split(";"))
	tbsRequestHeaders.sort()
	for (var i = 0; i < tbsRequestHeaders.length; i++) {
		if (req.getHeader(tbsRequestHeaders[i])){
			tbs += req.getHeader(tbsRequestHeaders[i]) + "\n"
		} else {
			tbs += "\n"
		}
	}
	if (req.getBody()){
		tbs += this.getHashAlgorithm(hash).generateHash(req.getBody())
	} else {
		tbs += this.getHashAlgorithm(hash).getHashOfEmptyBody()
	}

	return tbs
}


CREHMA.prototype.parseSignatureHeader = function(signatureHeader){
	var signatureMetaDataArray = signatureHeader.split(","); 
	var params = {};
	var param = "";
	for (var i = 0; i < signatureMetaDataArray.length; i++) {
		param = signatureMetaDataArray[i].split("=");

		switch(param[0]) {
		case "tvp":
		// code block
			params.tvp = param[1]
		break;
		case "sv":
			params.sv = param[1]
		break;
		case "kid":
			params.kid = param[1]
		break;
		case "sig":
			params.sig = param[1]
		break;
		case "hash":
			params.hash = param[1]
		break;
		case "addHeaders":
			params.addHeaders = param[1]
		break;
		}
	}

	return params;
}

CREHMA.prototype.getSignatureAlgorithm = function(name){
	return this.signatureAlgorithms[name];
}

CREHMA.prototype.addSignatureAlgorithm = function(name,signatureAlgorithm){
	this.signatureAlgorithms[name] = signatureAlgorithm;
}

CREHMA.prototype.addHashAlgorithm = function (name,hashAlgorithm){
	this.hashAlgorithms[name] = hashAlgorithm
}

CREHMA.prototype.getHashAlgorithm = function (name){
	return this.hashAlgorithms[name]
}

CREHMA.prototype.setETagGenerator = function (eTagGenerator){
	this.eTagGenerator = eTagGenerator
}

CREHMA.prototype.getETagGenerator = function (){
	return this.eTagGenerator
}


function sprintf(format, ...args) {
    let i = 0;
    return format.replace(/%s/g, () => args[i++]);
}
