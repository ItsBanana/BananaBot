'use strict';

const Schema = require('mongoose').Schema,
      Parser = require('../Parser');

let Track = new Schema({
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

module.exports = Track;