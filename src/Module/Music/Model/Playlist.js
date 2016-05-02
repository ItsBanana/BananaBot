'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      Track = require('./Track');

let Playlist = new Schema({
    name: {
        type: String,
        index: { unique: true }
    },
    tracks: [Track],
    user: String,
    createDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Playlist', Playlist);