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
        Model.Song.add(songTestObj, this.callback);
      },
      'No errors are created': function (err, song) {
        assert.equal(err, null);
      },
      'The song is created': function (err, song) {
        Model.Song.get(song.id, function(result){
          assert.deepEqual(song, result);
        });
      },
      'The song\'s album is created': function (err, song) {
        Model.Album.get({"name":songTestObj.album}, function(results){
          assert.equal(1, results.length);
        });
      },
      'The song\'s artist is created': function (err, song) {
        Model.Artist.get({"name":songTestObj.artist}, function(results){
          assert.equal(1, results.length);
        });
      }
    }
  }
}).exportTo(module); // Run it
