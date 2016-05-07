'use strict';

const Youtube = require('youtube-api');

class PlaylistHelper {
    get nextPageToken() {
        return this._nextPageToken || "";
    }

    constructor(container, logger, brain, yt_apikey) {
        this.container = container;
        this.logger = logger;
        this.brain = brain;
        this.yt_apikey = yt_apikey;

        this.initialize();
    }

    initialize() {
        Youtube.authenticate({
            type: 'key',
            key: this.yt_apikey
        });
    }

    getYoutubePlaylistVideos(link) {
        let regexHelper = this.container.get('helper.regex'),
            arrayHelper = this.container.get('helper.array');

        return new Promise((resolve, reject) => {
            regexHelper.getMatches(link, /(?:https ?:\/\/)?(?:youtu\.be\/|(?:www\.)?youtube\.com\/?.*)$/, matches => {
                if (matches) {
                    regexHelper.getMatches(matches[0], /[&?]list=([a-z0-9_]+)/i, matches => {
                        if (matches) {
                            this.buildYoutubePlaylist(matches[1]).then(videoIds => {
                                videoIds = arrayHelper.reverse(videoIds);
                                resolve(videoIds.map(videoId => `https://youtube.com/watch?v=${videoId}`));
                            });
                        } else {
                            reject(`This is not a valid playlist url!`);
                        }
                    });
                } else {
                    reject(`This is not a valid playlist url!`);
                }
            });
        });
    }

    buildYoutubePlaylist(playlistId, pageToken, videoIds) {
        pageToken = pageToken || "";
        videoIds = videoIds || [];

        return new Promise((resolve, reject) => {
            Youtube.playlistItems.list({
                "part": "snippet",
                "playlistId": playlistId,
                "pageToken": pageToken,
                "maxResults": 50
            }, (err, result) => {
                if (err) reject(err);

                // Filter the videos and remap them.
                let items = result.items.filter(item => item.snippet.title !== 'Private video')
                    .map(item => item.snippet.resourceId.videoId);

                // Lets concat the videoIds together.
                videoIds = videoIds.concat(items);

                // Oh noes there is another page...lets fetch that one to.
                if (result.nextPageToken) {
                    resolve(this.buildYoutubePlaylist(playlistId, result.nextPageToken, videoIds));
                } else {
                    // Think we got everything.
                    resolve(videoIds);
                }

            });
        });
    }
}

module.exports = PlaylistHelper;