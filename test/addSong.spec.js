var Model = require('../model.js'),
    vows = require('vows'),
    assert = require('assert'),
    songTestObj = { 
                    name: ' testSong',
                    artist: 'testArtist',
                    album: 'testAlbum',
                    year: null,
                    comment: null,
                    track: null,
                    genre: null,
                    urls: [
                            { 
                              url: '/home/dan/playlist/test/gust2006-04-11_01.mp3',
                              format: 'mpeg'
                            },
                            {
                              url: '/home/dan/playlist/test/gust2006-04-11_01.ogg',
                              format: 'ogg'
                            }
                          ]
                  };
// Create a Test Suite
vows.describe('add song').addBatch({
  'when a song is added': {
    topic: Model.add_song(songTestObj),
    'it\'s album and artist should be added too': function (topic) {
      Model.get_artist({"name": 'testArtist'}, function(results){
        assert.equal(results.length, 1);
      });
    }
  }
}).run(); // Run it
