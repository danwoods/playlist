// Module/Container for a library of music data

var _ = require("underscore");

var obj = {"artists":[]};

/* Function: artist_exist
 *
 *  Checks to see if artist exists in the library
 *
 *  Parameters:
 *   artist - name of artist
 *
 *  Returns:
 *   the artist object/undefined for exists/does not exist
 */
this.artist_exist = function (artist){
  // Return artist object (or undefined)
  return _.find(obj.artists, function(elm){return elm.artist == artist;});
};

/* Function: album_exist
 *
 *  Checks to see if album exists in the library. Creates artist if it does not already exist.
 *
 *  Parameters:
 *   album_obj - {
 *    artist - name of artist
 *    album -  name of album
 *   }
 *
 *  Returns:
 *   album_obj/undefined for exists/does not exist
 */
this.album_exist = function (album_obj){
  // Variables
  var artist_obj = this.artist_exist(album_obj.artist) || this.add_artist(album_obj.artist),  // artist object
      artist_idx = (_.indexOf(obj.artists, artist_obj));                                      // atrist index

  // Return the album object (or undefined)
  return _.find(obj.artists[artist_idx].albums, function(elm){return elm.album == album;});
};

/* Function: add_artist
 *
 *  If artists does not exist in library, adds artist to library
 *
 *  Parameters:
 *   artist - name of artist
 *
 *  Returns:
 *   artist object/false for added/already exists in library
 */
this.add_artist = function(artist){
  // If the artist doesn't already exist
  if(!this.artist_exist(artist)){
    // Add the arttist
    obj.artists.push({"artist":artist, "albums":[]});
    // And return it
    return {"artist":artist, "albums":[]};
  }
  // Else, return false
  return false;
}

/* Function: add_album
 *
 *  If album does not exist in library, adds album to library
 *
 *  Parameters:
 *   album_obj - {
 *    artist - name of artist
 *    album -  name of album
 *   }
 *
 *  Returns:
 *   album object/false for added/already exists in library
 */
this.add_album = function(album_obj){
  // Variables
  var artist_obj = this.artist_exist(album_obj.artist) || this.add_artist(album_obj.artist),
      artist_idx = (_.indexOf(obj.artists, artist_obj)),
      album_exists = _.find(obj.artists[artist_idx].albums, function(elm){return elm.album == album_obj.album;});

  // If album does not exists, confirm album_obj has the proper parameters, then add it and return
  if(!album_exists){
    album_obj.songs = [];
    obj.artists[artist_idx].albums.push(album_obj);
    return album_obj;
  }
  return false;
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
 *
 *  Returns:
 *   album object/false for added/already exists in library
 */
this.add_song = function(song_obj){
  var artist_obj = this.artist_exist(song_obj.artist) || this.add_artist(song_obj.artist),
      artist_idx = _.indexOf(obj.artists, artist_obj),
      album_obj = _.find(obj.artists[artist_idx].albums, function(elm){return elm.album == song_obj.album;}),
      album_idx = _.indexOf(obj.artists[artist_idx].albums, album_obj),
      song_exists = _.find(obj.artists[artist_idx].albums[album_idx].songs, function(elm){return elm.song == song_obj.title;});

  // If song does not exists, add it and return the song object
  if(!song_exists){
    obj.artists[artist_idx].albums[album_idx].songs.push(song_obj);
    return song_obj;
  }
  // Else, return false
  return false;
}

/* Function: get
 *
 *  Overwriting of console.log(), returns an indented, stringified version on obj
 *
 *  Returns:
 *   the library
 */
this.get = function(){
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
  return JSON.stringify(obj, null, 2);
}
