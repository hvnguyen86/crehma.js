var crypto = require('crypto');
var base64url = require("base64url");

module.exports = HMACSHA256;

function HMACSHA256(){
	this.name = "HMAC/SHA256"
	this.keyStore = {}
}

HMACSHA256.prototype.sign = function (tbs,kid){
	var key = this.getKey(kid);
	return base64url.fromBase64(crypto.createHmac("sha256", key).update(tbs).digest("base64"));
}

HMACSHA256.prototype.verify = function (tbs,sv,kid){
	var key = this.getKey(kid);
	if(key == undefined){
		return false;
	}
	var svOfRequest = base64url.fromBase64(crypto.createHmac("sha256", key).update(tbs).digest("base64"));
	
	if(svOfRequest == sv){
		return true;
	} else {
		return false;
	}
}

HMACSHA256.prototype.setKey = function(kid,key){
	this.keyStore[kid] = key;
}

HMACSHA256.prototype.getKey = function(kid){
	return this.keyStore[kid];
}

HMACSHA256.prototype.getName = function (){
	return this.name;
}