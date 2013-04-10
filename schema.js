// Schema for a library of music data
// **schema.js** acts as the schema of the model layer of playlist.js.
var resourceful = require("resourceful");

/*** Setup Schema ***/
// Set backend
resourceful.use('memory');

// Create resources
exports.Artist = resourceful.define('artist', function(){
  this.string('name');
});

exports.Album = resourceful.define('album', function(){
  this.string('name');
  this.parent('artist');
});

exports.Song = resourceful.define('song', function(){
  this.string('name');
  this.string('artist');
  this.string('album');
  this.array('urls');
  this.number('track');
  this.number('year');
  this.parent('album');
});
