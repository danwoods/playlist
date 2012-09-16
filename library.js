// Module/Container for a library of music data
// **library.js** acts as the model layer of playlist.js.

var _ = require("underscore");
var resourceful = require("resourceful");

/*** Setup Schema ***/
resourceful.use('memory');

// Create resources
var Artist = resourceful.define('artist');
Artist.string('name', { unique: true });

var Album = resourceful.define('album');
Album.string('name');

var Song = resourceful.define('song');
Song.string('name');
Song.string('artist');
Song.string('album');
Song.array('urls');
Song.number('track');
Song.number('year');

// Define relationships
Album.parent('artist');
Song.parent('album');

/*** Utility functions ***/
// Takes in string and returns corresponding object type
var stringToObj = function(str){ 
  var obj_type = {};

  if(str == 'artist'){
    obj_type = Artist;
  }
  else if(str == 'album'){
    obj_type = Album;
  }
  else if(str == 'song'){
    obj_type = Song;
  }

  return obj_type;
};

// Logs error messages in unified format
var log = function(msgs){
  console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  for(var msg in msgs){
    console.log(msgs[msg]);
  }
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n');
};

/*** Resource functions ***/ 

/* Function: add_artist
 *
 *  If artists does not exist in library, adds artist to library
 *
 *  Parameters:
 *   artist_name - name of artist
 *   callback - function to execute when artists is found or created
*/
var add_artist = function(artist_name, callback){
  var search_obj = {"id": artist_name};
  Artist.find(search_obj, function(err, results){
    if(!err){
      if(results.length == 0){
        // Create resource for artist
        Artist.create({
          id: artist_name
        }, function(err, artist){
          if(err){
            log(['Error in add_artist.create', err]);
          }
          if(callback){
            callback(artist);
          }
        });
      }
      else if(results.length == 1){ 
        if(callback){
          callback(results[0]);
        }
      }
      else{
        log(['Error in add_artist.find', 'Multiple artists already exist by that name']);
      }
    }
    else{
      log(['Error in add_artist.find', err]);
    }
  });
};

/* Function: add_album
 *
 *  If album does not exist in library, adds album to library
 *
 *  Parameters:
 *   album_obj - {
 *    artist - name of artist
 *    album -  name of album
 *   }
 *   callback - function to execute when artists is found or created
 *
 */
var add_album = function(album_obj, callback){
  var serach_obj = {"id": album_obj.name, artist: album_obj.artist};
  Album.find(serach_obj, function(err, results){
    if(!err){
      if(results.length == 0){
        // Create resource for album
        album_obj.artist.createAlbum({
          id: album_obj.name,
        }, function(err, album){
          if(err){
            log(['Error in add_album.create', err]);
          }
          if(callback){
            callback(album);
          }
        });
      }
      else if(results.length == 1){
        if(callback){
          callback(results[0]);
        }
      }
      else{
        log(['Error in add_album.find', 'Multiple albums already exist by that name']);
      }
    }
    else{
      log(['Error in add_album.find', err]);
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
this.add_song = function(song_obj){
  add_artist(song_obj.artist, function(artist){
    add_album({artist:artist, name:song_obj.album}, function(album){ 
      var search_obj = {"id": song_obj.name, "album.id": album.id};
      Song.find(search_obj, function(err, results){
        if(!err){
          if(results.length == 0){
            // Create resource for song
            song_obj.id = song_obj.name;
            song_obj.track = Number(song_obj.track);
            song_obj.year = Number(song_obj.year);
            album.createSong(song_obj, function(err, song){
              if(err){
                log(['Error in add_song.create', err]);
              }
            });
          }
        }
        else{
          log(['Error in add_song.find', err]);
        }
      }); 
    });
  });
}


/* Function: get
 *
 *  Overwriting of console.log(), returns an indented, stringified version on obj
 *
 *  Returns:
 *   the library
 */
this.get = function(){
  var obj = {};
  return obj;
}

/* Function: inspect
 *
 *  Overwriting of console.log(), returns an indented, stringified version on obj
 *
 *  Returns:
 *   the library
 */
this.inspect = function(){
  return JSON.stringify({}, null, 2);
}
