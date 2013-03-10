// Module/Container for a library of music data
// **model.js** acts as the model layer of playlist.js.

var Model       = exports,
    _           = require("underscore"),
    log         = require('winston');
    resourceful = require("resourceful");

/*** Setup Schema ***/
resourceful.use('memory');

// Setup logger
log.remove(log.transports.Console);
log.add(log.transports.Console, {colorize: true});

// Create resources
Model.Artist = resourceful.define('artist', function(){
  this.string('name');
});

Model.Album = resourceful.define('album', function(){
  this.string('name');
  this.parent('artist');
});

Model.Song = resourceful.define('song', function(){
  this.string('name');
  this.string('artist');
  this.string('album');
  this.array('urls');
  this.number('track');
  this.number('year');
  this.parent('album');
});

/*** Utility functions ***/

// Makes sure id is compatable with restful's api
var sanitize_id = function(id){
  var retStr = '';
  if(id){
    retStr = id.replace(/,/g, '').replace(/([^._a-zA-Z0-9-]+)/g, '_');
  }
  else{
    log.warn('model.js::sanitize_id, trying to sanitize a null id');
  }
  return retStr;
};

/*** Resource functions ***/ 

/* Function: add_artist
 *
 *  If artists does not exist in library, adds artist to library
 *
 *  Parameters:
 *   artist_name - name of artist
 *   callback - function(err, artist) to execute when artists is found or created
*/
var add_artist = function(artist_name, callback){
  var search_obj = {"name": artist_name};
  Model.Artist.find(search_obj, function(err, results){
    if(err){
      log.info(['LN: 118::Error in add_artist.find', err]);
    }
    else if(results.length == 0){
      Model.Artist.create({"id":sanitize_id(artist_name), "name":artist_name}, callback);
    }
    else if(results.length == 1){ 
      if(callback){
        callback(null, results[0]);
      }
    }
    else{
      log.info(['LN: 97::Error in add_artist.find', 'Multiple artists already exist by that name']);
    }
  });
};

/* Function: add_album
 *
 *  If album does not exist in library, adds album to library
 *
 *  Parameters:
 *    artist - artist resource
 *    callback - function(err, album) to execute when album is found or created
 *
 */
var add_album = function(artist, album_name, callback){
  var search_obj = {"id": album_name, "artist_id": artist.name};
  Model.Album.find(search_obj, function(err, results){
    if(err){
      log.info(['LN: 154::Error in add_album.find', err]);
    }
    else if(results.length == 0){
      log.info(['LN: 156::add_album.find', 'Creating album', 'artist = ', artist]);
      artist.createAlbum({"id": sanitize_id(album_name), "name": album_name}, callback);
    }
    else if(results.length == 1){
      if(callback){
        callback(null, results[0]);
      }
    }
    else{
      log.info(['LN: 179::Error in add_album.find', 'Multiple albums already exist by that name']);
    }
  }); 
};

/* Function: add_song
 *
 *  If album does not exist in library, adds album to library
 *
 *  Parameters:
 *   album_obj - {
 *    artist - name of artist
 *    album -  name of album
 *   }
 *
 */
Model.add_song = function(song_obj){
  // First make sure we have what we need to work with
  if(song_obj.artist && song_obj.album && song_obj.name){
    add_artist(song_obj.artist, function(err, artist){
      if(err){
        log.error('model.js::add_artist, '+JSON.stringify(err, null, 2));
      }
      add_album(artist, song_obj.album, function(err, album){ 
        if(err){
          log.error('model.js::add_album, '+JSON.stringify(err, null, 2));
        }
        var search_obj = {"id": song_obj.name.replace(/ /g, '_'), "album_id": album.name};
        Model.Song.find(search_obj, function(err, results){
          if(err){
            log.info(['LN: 193::Error in song_album.find', err]);
          }
          else if(results.length == 0){
            log.info(['LN: 156::add_song.find', 'Creating song']);
            album.createSong({
                              "id"  : sanitize_id(song_obj.name),
                              "name": song_obj.name,
                              "urls":song_obj.urls
                            },
                            function(err, song){
                              if(err){ 
                                log.info(['LN:  113:: Error in add_song.create:', err]);
                              }
                              else{
                                log.info(['LN:  116:: Added song:', song]);
                              }
                            }
            );
          }
          else if(results.length == 1){
            if(callback){
              callback(results[0]);
            }
          }
          else{
            log.info(['LN: 179::Error in add_album.find', 'Multiple albums already exist by that name']);
          }
        }); 
      });
    });
  }
  else{
    log.warn('model.js::add_song, trying to add a song with missing data. song_obj = '+JSON.stringify(song_obj, null, 2));
  }
};


/* Function: get_song
 *
 *  Gets song and executes callback, if provided
 *
 *  Parameters:
 *    song_id: _id of requested song
 *    callback - function to execute when artists is found or created
 *
 */
Model.get_song = function(song_id, callback){
  Model.Song.get(song_id, function(err, result){
    if(!err){
      if(callback){
        callback(result);
      }
    }
    else{
      log.info(['Error in get_song', err]);
    }
  });
};

/* Function: get_artist
 *
 *  Gets artist(s) and executes callback, if provided
 *
 *  Parameters:
 *    search_obj: object of search parameters
 *    callback: function to execute when artists is found or created
 *
 */
Model.get_artist = function(search_obj, callback){
  if(search_obj){
    Model.Artist.find(search_obj, function(err, results){
      if(!err){
        if(callback){
          callback(results);
        }
      }
      else{
        log.info(['Error in get_artist.Model.Artist_find', err]);
      }
    });
  }
  else{
    Model.Artist.all(function(err, results){
      if(!err){
        if(callback){
          callback(results);
        }
      }
      else{
        log.info(['Error in get_artist.Model.Artist_all', err]);
      }
      
    });
  }
};

/* Function: get_album
 *
 *  Gets album(s) and executes callback, if provided
 *
 *  Parameters:
 *    search_obj: object of search parameters
 *    callback: function to execute when artists is found or created
 *
 */
Model.get_album = function(search_obj, callback){
  if(search_obj){
    Model.Album.find(search_obj, function(err, results){
      if(!err){
        if(callback){
          callback(results);
        }
      }
      else{
        log.info(['Error in get_album.Model.Album_find', err]);
      }
    });
  }
  else{
    Model.Album.all(function(err, results){
      if(!err){
        if(callback){
          callback(results);
        }
      }
      else{
        log.info(['Error in get_album.Model.Album_all', err]);
      }
      
    });
  }
};
