CREHMAMessage = require("./CREHMAMessage.js")

module.exports = class CREHMAResponse extends CREHMAMessage{
	constructor(statusCode){
		super()
		this.statusCode = statusCode
	}

	getStatusCode(){
		return this.statusCode
	}

	setStatusCode(statusCode){
		this.statusCode = statusCode
	}
}