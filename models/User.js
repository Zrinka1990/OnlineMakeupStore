mongoose = require('mongoose')

const User = new mongoose.Schema ({
    email: {type:String, default:''},
    password: {type:String, default:''},
    timestamp: {type:Date, default:Date.now},
    isAdmin: {type:Boolean, default: false},
    nonce: {type:String, default:null},
    passwordResetTime: {type:Date, default:null}
})

module.exports = mongoose.model('User', User)
