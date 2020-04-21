const mongoose = require('../database')

const schema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
    },
    series: {
        type: String
    },
    media: {
        type: String,
        require: true
    },
    universe:{
        type: String,
        require: true
    },
    creator: {
        type: String
    },
    timeline: {
        type: Number
    },
    releasedate: {
        type: String
    },
    image: {
        type: String
    },
    url: {
        type: String,
        unique: true
    }
})

const Media = mongoose.model('media', schema)

module.exports = Media