var Model = require('../model.js'),
    vows = require('vows'),
    assert = require('assert'),
    songTestObj = { 
                    name    : 'test Song',
                    artist  : 'test Artist',
                    album   : 'test Album',
                    year    : 1981,
                    comment : null,
                    track   : 1,
                    genre   : null,
                    urls    : [
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
      'No errors are created': function (err, songRs) {
        assert.equal(err, null);
      },
      'The song is created': function (err, songRs) {
        Model.Song.get(songRs.id, function(err, result){
          assert.deepEqual(songRs, result);
        });
      },
      'The song\'s album is created': function (err, songRs) {
        Model.Album.find({"name":songTestObj.album}, function(err, results){
          assert.equal(1, results.length);
        });
      },
      'The song\'s artist is created': function (err, songRs) {
        Model.Artist.find({"name":songTestObj.artist}, function(results){
          assert.equal(1, results.length);
        });
      }
    }
  }
}).exportTo(module);
