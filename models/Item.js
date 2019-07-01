const mongoose = require('mongoose')

const Item = new mongoose.Schema({
	name: {type:String, default:''},
	description: {type:String, default:''},
    price: {type:Number, default:0},
    //array wich contains IDs of users interested in the item
	interested: {type:Array, default:[]}, 
	timestamp: {type:Date, default:Date.now}
})

module.exports = mongoose.model('Item', Item)
