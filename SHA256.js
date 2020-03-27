var crypto = require('crypto');
var base64url = require("base64url");


module.exports = SHA256;
function SHA256(){
	this.name = "SHA256";
	this.hashOfEmptyBody = "47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU";
	
}

SHA256.prototype.generateHash = function (body){
	return base64url.fromBase64(crypto.createHash('sha256').update(body).digest('base64'));
}


SHA256.prototype.getHashOfEmptyBody = function(){
	return this.hashOfEmptyBody;
}


SHA256.prototype.getName = function (){
	return this.name;
}