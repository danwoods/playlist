/*  TODO:
 *    * create actual errors
 *    * more detailed header explaination
 *    * down to 80 character lines
 *    * pass all validation
 *    * reduce code
 *    * comment code
 *    * have Jen proof-read documentation
 *    * have someone review some part of the code
 *
 * */

// Module/Container for a library of music data  
// **model.js** acts as the model layer of playlist.js. It exports the router 
// for the resourceful database and exposes needed database functionality

// #Contents
// 1. [Configuration/Setup](#section-3)
// 2. [Funtions/Objects](#section-5)
//  + [private](#section-6)
//      - [idSanitize](#section-7)
//      - [artistFindOrCreate](#section-8)
//      - [albumFindOrCreate](#section-9)
//      - [songFindOrCreate](#section-16)
//  + [public](#section-18)
//      + [Artist](#section-19)
//          - [find](#section-20)
//      + [Album](#section-21)
//          - [find](#section-22)
//      + [Song](#section-23)
//          - [add](#section-24)
//          - [get](#section-25)

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
//    `artist_name` : [string],  
//    `callback`    : [function(err, artist)]
var artistFindOrCreate = function(artist_name, callback){
  var searchObj = {"name": artist_name},
      createObj = {"name": artist_name};
  db.Artist.find(searchObj, function(err, results){
    if(err){
      callback(err);
    }
    else if(results.length === 0){
      createObj.id = idSanitize(artist_name);
      log.info('model.js::Creating artist: ' + createObj.name);
      db.Artist.create(createObj, callback);
    }
    else if(results.length === 1){ 
      callback(null, results[0]);
    }
    else{
      callback('model.js::artistFindOrCreate, Multiple artists already exist named: ' + artist_name);
    }
  });
};

// ###Function: albumFindOrCreate(artistRs, album_name, callback)
//    Searches for an album based on `album_name`; 
//    if album not found, album is created  
// **params**:  
//    `artistRs`  : [resource],  
//    `album_name`: [string],  
//    `callback`  : [function(err, album)]
var albumFindOrCreate = function(artistRs, album_name, callback){
  var searchObj = {"id": album_name, "artist_id": artistRs.name},
      createObj = {"name": album_name};
  db.Album.find(searchObj, function(err, results){
    if(err){
      callback(err);
    }
    // If no albums found
    else if(results.length == 0){
      // Create album, and pass off callback
      createObj.id = idSanitize(album_name);
      log.info('model.js::Creating album: ' + createObj.name);
      artistRs.createAlbum(createObj, callback);
    }
    // If album found
    else if(results.length === 1){
      // Call callback with album
      callback(null, results[0]);
    }
    // If more than one album found
    else{
      // Call callback with error
      callback('model.js::albumFindOrCreate, Multiple albums already exist named: ' + album_name);
    }
  }); 
};

// ###Function: songFindOrCreate(albumRs, songObj, callback)
//    Searches for a song based on album name/id and song name/id; 
//    if song not found, song is created  
// **params**:  
//    `albumRs` : [resource],  
//    `song_obj`: [obj],  
//    `callback`: [function(err, album)]
var songFindOrCreate = function(albumRs, songObj, callback){
  var searchObj = {"id": songObj.name.replace(/ /g, '_'), "album_id": albumRs.name},
      createObj = {"name": songObj.name, "urls": songObj.urls};
  db.Song.find(searchObj, function(err, results){
    if(err){
      callback(err);
    }
    else if(results.length == 0){
      createObj.id = idSanitize(songObj.name);
      log.info('model.js::Creating song: ' + createObj.name);
      albumRs.createSong(createObj, callback);
    }
    else if(results.length == 1){
      callback(null, results[0]);
    }
    else{
      log.info('model.js::songFindOrCreate, Multiple songs already exist named: ' + songObj.name);
    }
  }); 
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
    db.Artist.find(searchObj || {}, function(err, results){
      if(!err){
        callback(results);
      }
      else{
        log.info(['Error in get_artist.db.Artist_find', err]);
      }
    });
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
