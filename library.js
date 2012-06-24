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
  // Search for artist
  //console.log('In artist_exist, returning:');
  //console.dir(_.find(obj.artists, function(elm){return elm.artist == artist;}));
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
/*NOT CURRENTLY USED*/
this.album_exist = function (album_obj){
//console.log('obj');
//console.dir(obj);
  var artist_obj = this.artist_exist(album_obj.artist) || this.add_artist(album_obj.artist); // index
//console.log('artist_obj:');
//console.dir(artist_obj);
  var artist_idx = (_.indexOf(obj.artists, artist_obj));
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
  if(!this.artist_exist(artist)){
    obj.artists.push({"artist":artist, "albums":[]});
    return {"artist":artist, "albums":[]};
  }
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
  var artist_obj = this.artist_exist(album_obj.artist) || this.add_artist(album_obj.artist),
      artist_idx = (_.indexOf(obj.artists, artist_obj)),
      album_exists = _.find(obj.artists[artist_idx].albums, function(elm){return elm.album == album_obj.album;});

  // If album does not exists, confirm album_obj has the proper parameters, then add it and return
  if(!album_exists){
    album_obj.songs = [];
    //console.log('adding '+album_obj.album+' to '+album_obj.artist);
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
//console.log('song obj');
//console.dir(song_obj);
  var artist_obj = this.artist_exist(song_obj.artist) || this.add_artist(song_obj.artist);
//console.log('artist obj');
//console.dir(artist_obj);
  var artist_idx = _.indexOf(obj.artists, artist_obj);
//console.log('artist index');
//console.dir(artist_idx);
  var album_obj = _.find(obj.artists[artist_idx].albums, function(elm){return elm.album == song_obj.album;});
//console.log('album_obj');
//console.dir(album_obj);
  var album_idx = _.indexOf(obj.artists[artist_idx].albums, album_obj);
//console.log('album index');
//console.dir(album_idx);
  var song_exists = _.find(obj.artists[artist_idx].albums[album_idx].songs, function(elm){return elm.song == song_obj.title;});

  // If album does not exists, confirm album_obj has the proper parameters, then add it and return
  if(!song_exists){
    //console.log('adding '+song_obj.song+' to '+album_obj.artist);
    obj.artists[artist_idx].albums[album_idx].songs.push(song_obj);
    return song_obj;
  }
  return false;
}

/* Function: inspect
 *
 *  If artists does not exist in library, adds artist to library
 *
 *  Returns:
 *   the library
 */
this.inspect = function(){
  return JSON.stringify(obj, null, 2);
}
