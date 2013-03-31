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
                              url: '/testMP3.mp3',
                              format: 'mpeg'
                            },
                            {
                              url: '/testOGG.ogg',
                              format: 'ogg'
                            }
                          ]
                  };

// Test add
vows.describe('Add Song').addBatch({
  'When a song is added': {
    'No errors are created':{
      topic: function(){ 
        Model.add_song(songTestObj, this.callback);
      },
      'Model.add_song returns no errors': function (err, song) {
        assert.equal(err, null);
      }
    }
  }
}).exportTo(module); // Run it
