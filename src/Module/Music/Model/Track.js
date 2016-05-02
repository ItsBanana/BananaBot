'use strict';

const Schema = require('mongoose').Schema;

module.exports = new Schema({
    name: String,
    author: String,
    link: String,
    thumbnail: String,
    user: String,
    skips: Number,
    duration: String,
    createDate: {
        type: Date,
        default: Date.now
    }
});