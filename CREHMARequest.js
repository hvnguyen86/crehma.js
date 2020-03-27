CREHMAMessage = require("./CREHMAMessage.js")

module.exports = class CREHMARequest extends CREHMAMessage {
	constructor(method,target){
		super()
		this.method = method
		this.target = target
	}

	getMethod(){
		return this.method
	}

	setMethod(method){
		this.method = method.uppercase()
	}

	getTarget(){
		return this.target
	}

	setTarget(target){
		this.target = target
	}
}