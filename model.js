var Model = exports,
    resourceful = require("resourceful");

/*** Setup Schema ***/
resourceful.use('memory');

// Create resources
Model.Artist = resourceful.define('artist', function(){
  //this.string('name', { uniqueItem: true });
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

