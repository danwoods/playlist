// Module/Container for a library of music data
// **model.js** acts as the model layer of playlist.js.

var Model = exports,
    _ = require("underscore"),
    resourceful = require("resourceful");

/*** Setup Schema ***/
resourceful.use('memory');

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

// Logs error messages in unified format
var log = function(msgs){
  console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  for(var msg in msgs){
    console.log(msgs[msg]);
  }
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n');
};

// Makes sure id is compatable with restful's api
var sanitize_id = function(id){
  return id.replace(/,/g, '').replace(/([^._a-zA-Z0-9-]+)/g, '_');
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
      log(['LN: 118::Error in add_artist.find', err]);
    }
    else if(results.length == 0){
      log(['LN: 124::add_artist.find', 'Creating artist']);
      Model.Artist.create({"id":sanitize_id(artist_name), "name":artist_name}, callback);
    }
    else if(results.length == 1){ 
      if(callback){
        callback(null, results[0]);
      }
    }
    else{
      log(['LN: 97::Error in add_artist.find', 'Multiple artists already exist by that name']);
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
      log(['LN: 154::Error in add_album.find', err]);
    }
    else if(results.length == 0){
      log(['LN: 156::add_album.find', 'Creating album', 'artist = ', artist]);
      artist.createAlbum({"id": sanitize_id(album_name), "name": album_name}, callback);
    }
    else if(results.length == 1){
      if(callback){
        callback(null, results[0]);
      }
    }
    else{
      log(['LN: 179::Error in add_album.find', 'Multiple albums already exist by that name']);
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
  add_artist(song_obj.artist, function(err, artist){
    add_album(artist, song_obj.album, function(err, album){ 
      var search_obj = {"id": song_obj.name.replace(/ /g, '_'), "album_id": album.name};
      Model.Song.find(search_obj, function(err, results){
        if(err){
          log(['LN: 193::Error in song_album.find', err]);
        }
        else if(results.length == 0){
          log(['LN: 156::add_song.find', 'Creating song']);
          album.createSong({
                            "id": sanitize_id(song_obj.name),
                            "name": song_obj.name,
                            "urls":song_obj.urls
                          },
                          function(err, song){
                            if(err){ 
                              log(['LN:  113:: Error in add_song.create:', err]);
                            }
                            else{
                              log(['LN:  116:: Added song:', song]);
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
          log(['LN: 179::Error in add_album.find', 'Multiple albums already exist by that name']);
        }
      }); 
    });
  });
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
      log(['Error in get_song', err]);
    }
  });
};

/* Function: get_artist
 *
 *  Gets artist(s) and executes callback, if provided
 *
 *  Parameters:
 *    search_obj: object of search parameters
 *    callback - function to execute when artists is found or created
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
        log(['Error in get_artist.Model.Artist_find', err]);
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
        log(['Error in get_artist.Model.Artist_all', err]);
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
 *    callback - function to execute when artists is found or created
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
        log(['Error in get_album.Model.Album_find', err]);
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
        log(['Error in get_album.Model.Album_all', err]);
      }
      
    });
  }
};

/* Function: get
 *
 *  Overwriting of console.log(), returns an indented, stringified version on obj
 *
 *  Returns:
 *   the library
 */
Model.get = function(){
  var obj = {};
  return obj;
}

Model.get_artists = function(){
  Model.Artist.all(function(err, results){
    log(['LN: 340::Artist = ', JSON.stringify(results, null, 2)]);
  });
};

/* Function: inspect
 *
 *  Overwriting of console.log(), returns an indented, stringified version on obj
 *
 *  Returns:
 *   the library
 */
Model.inspect = function(){
  return JSON.stringify({}, null, 2);
}
