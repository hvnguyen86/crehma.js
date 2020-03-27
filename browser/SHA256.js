function SHA256(){
	this.name = "SHA256";
	this.hashOfEmptyBody = "47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU";
	
}

SHA256.prototype.generateHash = async function (body){
	var hash = await crypto.subtle.digest({name: "SHA-256"}, convertStringToArrayBufferView(body));
    return base64EncodeUrl(arrayBufferToBase64(hash));
}


SHA256.prototype.getHashOfEmptyBody = function(){
	return this.hashOfEmptyBody;
}


SHA256.prototype.getName = function (){
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

function convertStringToArrayBufferView(str)
{
    var bytes = new Uint8Array(str.length);
    for (var iii = 0; iii < str.length; iii++) 
    {
        bytes[iii] = str.charCodeAt(iii);
    }

    return bytes;
}

function base64EncodeUrl(str){
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
} 
