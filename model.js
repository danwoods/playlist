// Module/Container for a library of music data
// **model.js** acts as the model layer of playlist.js.

// #Contents
// 1. [Configuration/Setup](#section-3)
// 2. [Funtions/Objects](#section-5)
//  + [private](#section-6)
//      - [idSanitize](#section-7)
//      - [artistFindOrCreate](#section-8)
//      - [albumFindOrCreate](#section-9)
//  + [public](#section-16)
//      + [artist](#section-17)
//          - [get](#section-18)
//      + [album](#section-20)
//          - [get](#section-21)
//      + [song](#section-22)
//          - [add](#section-23)
//          - [get](#section-24)

var _           = require("underscore"),
    log         = require('./log').logger,
    restful     = require("restful"),
    db          = require('./schema');

//
// #Configuration/Setup#
//

// Setup router
exports.router = restful.createRouter([db.Artist, db.Album, db.Song], { explore: false });

//
// #Functions#
//

// ##Private##

// ###Function: idSanitize(id)
//    Makes sure id is compatable with restful's api  
// **params**:  
//    `id`: [string]  
// **returns**:  
//    A modified `id`, with commas and any othe non-alphanumeric characters,
//    replaced with underscores
var idSanitize = function(id){
  var retStr = '';
  if(id){
    retStr = id.replace(/,/g, '').replace(/([^._a-zA-Z0-9-]+)/g, '_');
  }
  else{
    log.warn('model.js::idSanitize, trying to sanitize a null id');
  }
  return retStr;
};

// ###Function: artistFindOrCreate(artist_name, callback)
//    Searches for an artist based on `artist_name`; 
//    if artist not found, artist is created  
// **params**:  
//    `artist_name`: [string],  
//    `callback`: [function(err, artist)]
var artistFindOrCreate = function(artist_name, callback){
  var search_obj = {"name": artist_name};
  db.Artist.find(search_obj, function(err, results){
    if(err){
      if(callback){
        callback('model.js::artistFindOrCreate, Error when searching for artist "' + artist_name + '", error: '+ err);
      }
    }
    else if(results.length == 0){
      log.info('model.js::artistFindOrCreate, Creating artist: ' + artist_name);
      db.Artist.create({"id":idSanitize(artist_name), "name":artist_name}, callback);
    }
    else if(results.length == 1){ 
      if(callback){
        callback(null, results[0]);
      }
    }
    else{
      if(callback){
        callback('model.js::artistFindOrCreate, Multiple artists already exist named: ' + artist_name);
      }
    }
  });
};

// ###Function: albumFindOrCreate(artist, album_name, callback)
//    Searches for an album based on `album_name`; 
//    if album not found, album is created  
// **params**:  
//    `artist`: [resource],  
//    `album_name`: [string],  
//    `callback`: [function(err, album)]
var albumFindOrCreate = function(artist, album_name, callback){
  var search_obj = {"id": album_name, "artist_id": artist.name};
  db.Album.find(search_obj, function(err, results){
    if(err){
      if(callback){
        callback('model.js::albumFindOrCreate, Error when searching for album "' + album_name + '", error: '+ err);
      }
    }
    // If no albums found
    else if(results.length == 0){
      // Create album, and pass off callback
      log.info('model.js::albumFindOrCreate, Creating album: ' + album_name);
      artist.createAlbum({"id": idSanitize(album_name), "name": album_name}, callback);
    }
    // If album found
    else if(results.length === 1){
      // Call callback with album
      if(callback){
        callback(null, results[0]);
      }
    }
    // If more than one album found
    else{
      // Call callback with error
      if(callback){
        callback('model.js::albumFindOrCreate, Multiple albums already exist named: ' + album_name);
      }
    }
  }); 
};

// ##Public##


// ###Object: artist
//    Contains functionality for working with artist resources  
// **functions**:  
//    `get`: [function(search_obj, callback)]  
exports.artist = {
  // ###Function: get(search_obj, callback)
  //    Retrieves artist(s) from the database  
  // **params**:  
  //    `search_obj`: [{artist attributes}] *may be empty/null to request all artist*,  
  //    `callback`: [function(results)]
  get : function(search_obj, callback){
    if(search_obj){
      db.Artist.find(search_obj, function(err, results){
        if(!err){
          if(callback){
            callback(results);
          }
        }
        else{
          log.info(['Error in get_artist.db.Artist_find', err]);
        }
      });
    }
    else{
      db.Artist.all(function(err, results){
        if(!err){
          if(callback){
            callback(results);
          }
        }
        else{
          log.info(['Error in get_artist.db.Artist_all', err]);
        }
        
      });
    }
  }
};

// ###Object: album
//    Contains functionality for working with album resources  
// **functions**:  
//    `get`: [function(search_obj, callback)]  
exports.album = {
  // ###Function: get(search_obj, callback)
  //    Retrieves albums(s) from the database  
  // **params**:  
  //    `search_obj`: [{album attributes}] *may be empty/null to request all albums*,  
  //    `callback`: [function(results)]
  get : function(search_obj, callback){
    if(search_obj){
      db.Album.find(search_obj, function(err, results){
        if(!err){
          if(callback){
            callback(results);
          }
        }
        else{
          log.info(['Error in album.get.db.Album_find', err]);
        }
      });
    }
    else{
      db.Album.all(function(err, results){
        if(!err){
          if(callback){
            callback(results);
          }
        }
        else{
          log.info(['Error in album.get.db.Album_all', err]);
        }
        
      });
    }
  }
};

// ###Object: song
//    Contains functionality for working with song resources  
// **functions**:  
//    `get`: [function(song_id, callback)],  
//    `add`: [function(song_obj, callback)]
exports.song = {
  // ###Function: get(song_id, callback)
  //    Retrieves song from the database  
  // **params**:  
  //    `song_id`: [string],  
  //    `callback`: [function(song)]
  get : function(song_id, callback){
    db.Song.get(song_id, function(err, result){
      if(!err){
        if(callback){
          callback(result);
        }
      }
      else{
        log.info(['Error in get_song', err]);
      }
    });
  },
  // ###Function: add(song_obj, callback)  
  //    If song does not exist in library, add song to library.
  //    Creates artist and album if they don't exist.  
  // **params**:  
  //    `song_obj`: [  
  //        {  
  //          `name`    : [string],  
  //          `artist`  : [string],  
  //          `album`   : [string],  
  //          `year`    : [string],  
  //          `comment` : [string],  
  //          `track`   : [string],  
  //          `genre`   : [string],  
  //          `urls`    : [ [{`url`: [string], `format` : [string]},] ]  
  //        }  
  //    ],  
  //    `callback`: [function(err, songObj)]
  add : function(song_obj, callback){
    var funcInitialCallback = callback;
    // Avoid 'undefined's
    if(song_obj.artist && song_obj.album && song_obj.name){
      // Call artistFindOrCreate to create the song's artist (or retrieve, if it exist)
      artistFindOrCreate(song_obj.artist, function(err, artist){
        if(err){
          log.error('model.js::add_song, Error adding artist "' + song_obj.artist + '", error: ' + JSON.stringify(err, null, 2));
        }
        albumFindOrCreate(artist, song_obj.album, function(err, album){ 
          if(err){
            log.error('model.js::add_song, Error adding album "' + song_obj.album + '", error: ' + JSON.stringify(err, null, 2));
          }
          var search_obj = {"id": song_obj.name.replace(/ /g, '_'), "album_id": album.name};
          db.Song.find(search_obj, function(err, results){
            if(err){
              log.error('model.js::add_song, Error finding song "' + song_obj.name + '", error: ' + JSON.stringify(err, null, 2));
            }
            else if(results.length == 0){
              log.info('model.js::add_song, Creating song: ' + song_obj.name);
              album.createSong({
                                "id"  : idSanitize(song_obj.name),
                                "name": song_obj.name,
                                "urls":song_obj.urls
                              },
                              function(err, song){
                                if(err){ 
                                  log.error('model.js::add_song, Error adding song "' + song_obj.name + '", error: ' + JSON.stringify(err, null, 2));
                                }
                                if(callback){
                                  callback(err, song);
                                }
                                if(funcInitialCallback){
                                  funcInitialCallback(err, song);
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
              log.info(['LN: 179::Error in albumFindOrCreate.find', 'Multiple albums already exist by that name']);
            }
          }); 
        });
      });
    }
    else{
      log.warn('model.js::add_song, trying to add a song with missing data. song_obj = '+JSON.stringify(song_obj, null, 2));
    }
  }
};
