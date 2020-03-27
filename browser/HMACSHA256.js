function HMACSHA256(){
	this.name = "HMAC/SHA256"
	this.keyStore = {}
}

HMACSHA256.prototype.sign = async function (tbs,kid){
	var key = this.getKey(kid);
	var sv = await crypto.subtle.sign({name: "HMAC"}, key, convertStringToArrayBufferView(tbs));
    return base64EncodeUrl(arrayBufferToBase64(sv));
}

HMACSHA256.prototype.verify = async function (tbs,sv,kid){
	var key = this.getKey(kid);
	if(key == undefined){
		return false;
	}
	var svTemp = await crypto.subtle.sign({name: "HMAC"}, key, convertStringToArrayBufferView(tbs));
	
    return base64EncodeUrl(arrayBufferToBase64(svTemp)) == sv ? true : false;
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

function arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64EncodeUrl(str){
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}


function convertStringToArrayBufferView(str)
{
    var bytes = new Uint8Array(str.length);
    for (var iii = 0; iii < str.length; iii++) 
    {
        bytes[iii] = str.charCodeAt(iii);
    }

    return bytes;
}   
