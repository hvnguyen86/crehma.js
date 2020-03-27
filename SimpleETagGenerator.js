var crypto = require('crypto');
var base64url = require("base64url");


module.exports = SimpleETagGenerator;
function SimpleETagGenerator(){
	this.size = 10
}

SimpleETagGenerator.prototype.generateETag = function(body){
	hashOfBody = base64url.fromBase64(crypto.createHash('sha256').update(body).digest('base64'));
	return base64url.fromBase64(crypto.createHash('sha256').update(hashOfBody + new Date().getTime()).digest('base64')).substring(0,this.size); 
}