String.prototype.capitalizeHeader = function() {
  return this.split("-").map(function (text) {
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
   }).join("-");
}

module.exports = class CREHMAMessage {
	constructor(){
		this.version = "1.1"
		this.headers = {}
		this.body = null
	}

	getHeader(header){
		return this.headers[header.toLowerCase()]
	}

	setHeader(header, value){
		if(header)
			this.headers[header.toLowerCase()] = value;
	}

	getBody(){
		return this.body
	}

	setBody(body){
		this.body = body
	}

	setVersion(version){
		this.version = version
	}

	getVersion(){
		return this.version
	}
}
