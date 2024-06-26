const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
})

module.exports = mongoose.model('Users', userSchema)