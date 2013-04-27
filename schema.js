// Schema for a library of music data
// **schema.js** acts as the schema of the model layer of playlist.js.
// Artist and Album resource create/find operations are synchronous
// to preserve hierarchies
var resourceful = require("resourceful");

// Set backend
resourceful.use('memory');

/* Function: fireQueue
 *
 *  Fires the next function is a specified queue
 *
 *  Parameters:
 *    queueName - the name of the Resource of the queue (ie: 'artist')
 *
 */
var fireQueue = function(queueName){
  var query = {};
  if(queueName === 'artist'){
    if(exports.Artist.requestQueue.length > 0){
      query = exports.Artist.requestQueue.pop();
      if(query.type === 'create'){
        exports.Artist.create(query.artist, query.callback);
      }
      else if(query.type === 'find'){
        exports.Artist.find(query.search, query.callback);
      }
    }
  }
  else if(queueName === 'album'){
    if(exports.Album.requestQueue.length > 0){
      query = exports.Album.requestQueue.pop();
      if(query.type === 'create'){
        exports.Album.create(query.album, query.callback);
      }
      else if(query.type === 'find'){
        exports.Album.find(query.search, query.callback);
      }
    }
  }
};

/*** Setup Resources ***/
/* Artist */
exports.Artist = resourceful.define('artist', function(){
  this.string('name');
});
exports.Artist.busy = false;
exports.Artist.requestQueue = [];

// Check the busy state of Artist before creating
// to create synchronous operation
exports.Artist.before('create', function(artist, callback) {
  if(exports.Artist.busy === true){
    exports.Artist.requestQueue.push({'type': 'create', 'artist':artist, 'callback':callback});
  }
  else{
    exports.Artist.busy = true;
    callback();
  }
});

// Clear the busy state of Artist after creating
// and fire next operation in the queue
exports.Artist.after('create', function(err, artist, callback) {
  exports.Artist.busy = false;
  callback();
  fireQueue('artist');
});

// Check the busy state of Artist before searching
// to create synchronous operation
exports.Artist.before('find', function(artist, callback) {
  if(exports.Artist.busy === true){
    exports.Artist.requestQueue.push({'type': 'find', 'search':artist.id, 'callback':callback});
  }
  else{
    exports.Artist.busy = true;
    callback();
  }
});

// Clear the busy state of Artist after searching
// and fire next operation in the queue
exports.Artist.after('find', function(err, artist, callback) {
  exports.Artist.busy = false;
  callback();
  fireQueue('artist');
});

/* Album */
exports.Album = resourceful.define('album', function(){
  this.string('name');
  this.parent('artist');
});
exports.Album.busy = false;
exports.Album.requestQueue = [];

// Check the busy state of Album before creating
// to create synchronous operation
exports.Album.before('create', function(album, callback) {
  if(exports.Album.busy === true){
    exports.Album.requestQueue.push({'type': 'create', 'album':album, 'callback':callback});
  }
  else{
    exports.Album.busy = true;
    callback();
  }
});

// Clear the busy state of Album after creating
// and fire next operation in the queue
exports.Album.after('create', function(err, album, callback) {
  exports.Album.busy = false;
  callback();
  fireQueue('album');
});

// Check the busy state of Album before searching
// to create synchronous operation
exports.Album.before('find', function(album, callback) {
  var search = {};
  if(exports.Album.busy === true){
    search = {"name":album.id.id, "artist_id":album.id.artist_id};
    exports.Album.requestQueue.push({'type': 'find', 'search':search, 'callback':callback});
  }
  else{
    exports.Album.busy = true;
    callback();
  }
});

// Clear the busy state of Album after searching
// and fire next operation in the queue
exports.Album.after('find', function(err, album, callback) {
  exports.Album.busy = false;
  callback();
  fireQueue('album');
});

/* Song */
exports.Song = resourceful.define('song', function(){
  this.string('name');
  this.string('artist');
  this.string('album');
  this.array('urls');
  this.number('track');
  this.number('year');
  this.parent('album');
});
