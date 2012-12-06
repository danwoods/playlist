// Playlist module
var Playlist = function(elm) {

  var api = new API();

  /* UI */
  var dragEnter = function(e) {
    // this / e.target is the current hover target.
  };
  var dragLeave = function(e) {
    // this / e.target is previous target element.
  };
  var dragOver = function(e){
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
            
    return false;
  };
  var drop = function(e) {
    // this / e.target is current target element.
    if (e.stopPropagation) {
      e.stopPropagation(); // stops the browser from redirecting.
    }
    console.log('dropped'); 
    console.log(e.dataTransfer.getData('text/plain')); 
    addSong(JSON.parse(e.dataTransfer.getData('text/plain')));
    return false;
  };

  // Add Song Placeholder
  // Used to visually represent where a song will be in the playlist
  var addPlaceholder = function(idx, removeOthers){
    var placeholderElm = $('<li /');
    placeholderElm.addClass('placeholder');
    placeholderElm.text('Drop Song Here');
    $(elm + ' ol').append(placeholderElm);
  };

  // Add Song
  var addSong = function(songObj, idx){
    api.getSongs({"id": songObj.id}, function(data){
      var songElm = $('<li />');
      songElm.addClass('song');
      songElm.text(songObj.name);
      $(elm + ' ol').append(songElm);
    });
  };

  // Get all songs
  this.getSongs = function(){
    var songArr = [];

    // Get song elements

  };

  // Get data of next song to play
  this.getNextSong = function(callback){
    api.getSongs(null, function(data){
      data = data.song[0];
      if(callback){
        callback(data);
      }
    });
  };

  // Add event listeners and bindings, and create any required elements
  $('document').ready(function(){
    $(elm).get()[0].addEventListener('dragover', dragOver, false);
    $(elm).get()[0].addEventListener('drop', drop, false);
    // Add a containner for the list elements
    $(elm).append('<ol dropzone="copy string:text/x-example" />');
  });
};

// Instansiate module
var playlist = new Playlist('section#playlist');
