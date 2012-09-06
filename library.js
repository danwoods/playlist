// Module/Container for a library of music data
// **library.js** acts as the model layer of playlist.js.

var _ = require("underscore");
var resourceful = require("resourceful");

/*** Testing resourceful ***/
resourceful.use('memory');
 
var Artist = resourceful.define('artist');
Artist.string('name');

var Album = resourceful.define('album');
Album.string('name');

var Song = resourceful.define('song');
Song.string('name');

//
// Now we add a special property to Article indicating that Author is its parent
//
Album.parent('artist');
Song.parent('album');
 
/*** ***/

var obj = {"artists":[]};

var newObj = function(){
  this.type = "",
  this.id = 0,
  this.rel_id = 0,
  this.parent_id = 0,
  this.children =  [],
  this.unique = {};
};

obj = new newObj();
obj.type = "library";
obj.id = 0;
obj.rel_id = 0;

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
  return _.find(obj.children, function(elm){return elm.name == artist;});
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
    // Add the artist
    var newArtist = new newObj();
    newArtist.type = "artist";
    newArtist.name = artist;
    newArtist.id = _.uniqueId();
    obj.children.push(newArtist);

    // Create resource for artist
    Artist.create({
      id: newArtist.id,
      name: artist
    }, function(err, newArtist){
      
      console.log("Just added ");
      console.log(newArtist);
      console.log(" to artists");
    });
    console.log('added artist: \n'+JSON.stringify(newArtist));

    // And return it
    return newArtist;
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
      artist_idx = (_.indexOf(obj.children, artist_obj)),
      album_exists = _.find(obj.children[artist_idx].children, function(elm){return elm.name == album_obj.album;});

  // If album does not exists, confirm album_obj has the proper parameters, then add it and return
  if(!album_exists){
    album_obj.songs = [];
    var newAlbum = new newObj();
    newAlbum.name = album_obj.album;
    newAlbum.type = 'album';
    newAlbum.id = _.uniqueId();
    obj.children[artist_idx].children.push(newAlbum);
    // Create resource for album
    Album.create({
      id: newAlbum.id,
      name: album_obj.album
    }, function(err, newAlbum){
      
      console.log("Just added ");
      console.log(newAlbum);
      console.log(" to album");
    });
    console.log('added album: \n'+JSON.stringify(newAlbum));
    return album_obj;
  }
  return false;
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
 *  Returns:
 *   album object/false for added/already exists in library
 */
this.add_song = function(song_obj){
  var artist_obj = this.artist_exist(song_obj.artist) || this.add_artist(song_obj.artist),
      artist_idx = _.indexOf(obj.children, artist_obj),
      album_obj = _.find(obj.children[artist_idx].children, function(elm){return elm.name == song_obj.album;}),
      album_idx = _.indexOf(obj.children[artist_idx].children, album_obj),
      song_exists = _.find(obj.children[artist_idx].children[album_idx].children, function(elm){return elm.title == song_obj.title;});

  // If song does not exists, add it and return the song object
  // FOR RIGHT NOW, ALLOW ALL FILES
  //if(!song_exists){
    //var newSong = new newObj();
    //newSong.name = song_obj.song;
    //newSong.type = 'song';
    song_obj.id = _.uniqueId();
    obj.children[artist_idx].children[album_idx].children.push(song_obj);
    // Create resource for song
    Song.create({
      id: song_obj.id,
      name: song_obj.title
    }, function(err, newSong){
      
      console.log("Just added ");
      console.log(newSong);
      console.log(" to songs");
    });
    console.log('added song: \n'+JSON.stringify(song_obj));
    return song_obj;
  //}
  // Else, return false
  //return false;
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
