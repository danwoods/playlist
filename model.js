// Module/Container for a library of music data  
// **model.js** acts as the model layer of playlist.js. It exports 
// the router for the resourceful database and acts as an interface 
// for it while adding needed functionality.

// #Contents
// - [Configuration/Setup](#section-4)
// + [Funtions/Objects](#section-6)
//  + [private](#section-7)
//      - [idSanitize](#section-8)
//      - [rsFindOrCreate](#section-9)
//      - [artistFindOrCreate](#section-13)
//      - [albumFindOrCreate](#section-14)
//      - [songFindOrCreate](#section-15)
//  + [public](#section-16)
//      + [Artist](#section-17)
//          - [find](#section-18)
//      + [Album](#section-19)
//          - [find](#section-20)
//      + [Song](#section-21)
//          - [add](#section-22)
//          - [get](#section-25)

var log         = require('./log').logger,
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

// ###Function: rsFindOrCreate(rsType, searchObj, createFunc, callback)
//    Searches for a resource based on `searchObj`. Meant to find a 
//    single resource. If resource not found, createObj is created. 
//    If multiple resources found, err is returned.  
// **params**:  
//    `rsType`    : [resource type, ie: `db.Artist`],  
//    `searchObj` : [{resource type attributes}],  
//    `createFunc`: [function()],  
//    `callback`  : [function(err, resource)]
var rsFindOrCreate = function(rsType, searchObj, createFunc, callback){
  rsType.find(searchObj, function(err, results){
    // If error or more than one resource found, 
    // provide additional data and pass error to callback
    if(err || (results && results.length > 1)){
      err = err || new Error('model.js::rsFindOrCreate, Multiple objects already exist');
      err.func    = err.func || rsType.find;
      err.params  = err.params || searchObj;
      err.result      = err.result || results;
      callback(err);
    }
    // If resource found, pass it to callback
    else if(results && results.length === 1){
      callback(null, results[0]);
    }
    // If no resource found, fire create function
    else{
      createFunc();
    }
  }); 
};

// ###Function: artistFindOrCreate(artist_name, callback)
//    Wrapper for `rsFindOrCreate()`. Searches for an artist 
//    based on `artist_name`; if artist not found, artist is created  
// **params**:  
//    `artist_name` : [string],  
//    `callback`    : [function(err, artist)]
var artistFindOrCreate = function(artist_name, callback){
  var searchObj  = {"name": artist_name},
      createObj  = {"id": idSanitize(artist_name), "name": artist_name},
      createFunc = function(){
        log.info('model.js::Creating artist: ' + createObj.name);
        db.Artist.create(createObj, callback);
      };
  rsFindOrCreate(db.Artist, searchObj, createFunc, callback);
};

// ###Function: albumFindOrCreate(artistRs, album_name, callback)
//    Wrapper for `rsFindOrCreate()`. Searches for an album 
//    based on `album_name` and `artistRs.id`; if album not found, 
//    album is created  
// **params**:  
//    `artistRs`  : [resource],  
//    `album_name`: [string],  
//    `callback`  : [function(err, album)]
var albumFindOrCreate = function(artistRs, album_name, callback){
  var searchObj  = {"id": album_name, "artist_id": artistRs.id},
      createObj  = {"id": idSanitize(album_name), "name": album_name}, 
      createFunc = function(){
        log.info('model.js::Creating album: ' + createObj.name);
        artistRs.createAlbum(createObj, callback);
      };
  rsFindOrCreate(db.Album, searchObj, createFunc, callback);
};

// ###Function: songFindOrCreate(albumRs, songObj, callback)
//    Wrapper for `rsFindOrCreate()`. Searches for a song 
//    based on `songObj.name` and `albumRs.id`; if song not found, 
//    song is created  
// **params**:  
//    `albumRs` : [resource],  
//    `songObj` : [{song attributes}],  
//    `callback`: [function(err, song)]
var songFindOrCreate = function(albumRs, songObj, callback){
  var searchObj  = {"id": idSanitize(songObj.name), "album_id": albumRs.id},
      createObj  = {"id": idSanitize(songObj.name), "name": songObj.name, "urls": songObj.urls},
      createFunc = function(){
        log.info('model.js::Creating song: ' + createObj.name);
        albumRs.createSong(createObj, callback);
      };
  rsFindOrCreate(db.Song, searchObj, createFunc, callback);
};

// ##Public##

// ###Object: Artist
//    Contains functionality for working with artist resources  
// **functions**:  
//    `find`: [function(searchObj, callback)]  
exports.Artist = {
  // ###Function: find(searchObj, callback)
  //    Retrieves artist(s) from the database  
  // **params**:  
  //    `searchObj`: [{artist attributes}] *may be empty/null to request all artist*,  
  //    `callback`: [function(results)]
  find : function(searchObj, callback){
    db.Artist.find(searchObj || {}, callback);
  }
};

// ###Object: Album
//    Contains functionality for working with album resources  
// **functions**:  
//    `find`: [function(searchObj, callback)]  
exports.Album = {
  // ###Function: find(searchObj, callback)
  //    Retrieves albums(s) from the database  
  // **params**:  
  //    `searchObj`: [{album attributes}] *may be empty/null to request all albums*,  
  //    `callback`: [function(results)]
  find : function(searchObj, callback){
    db.Album.find(searchObj || {}, callback);
  }
};

// ###Object: Song
//    Contains functionality for working with song resources  
// **functions**:  
//    `add`: [function(songObj, callback)],  
//    `get`: [function(songId, callback)]  
exports.Song = {
  // ###Function: add(songObj, callback)  
  //    If song does not exist in library, add song to library.
  //    Creates artist and album if they don't exist.  
  // **params**:  
  //    `songObj`: [  
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
  //    `callback`: [function(err, songRs)]
  add : function(songObj, callback){
    // Avoid 'undefined's
    if(songObj.artist && songObj.album && songObj.name){
      // Call artistFindOrCreate to create the song's 
      // artist or retrieve it, if it exist
      artistFindOrCreate(songObj.artist, function(err, artist){
        if(err){
          callback(err);
        }
        else{
          albumFindOrCreate(artist, songObj.album, function(err, album){ 
            if(err){
              callback(err);
            }
            else{
              songFindOrCreate(album, songObj, callback);
            }
          });
        }
      });
    }
    else{
      log.warn('Model.Song.add, trying to add a song with missing data. songObj = '+JSON.stringify(songObj, null, 2));
    }
  },
  // ###Function: get(songId, callback)
  //    Retrieves song from the database.  
  // **params**:  
  //    `songId`: [string],  
  //    `callback`: [function(err, songRs)]
  get : function(songId, callback){
    db.Song.get(songId, callback);
  }
};
