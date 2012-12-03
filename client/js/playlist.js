// Playlist module
var Playlist = (function () {

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
    $('section#playlist ol').append(placeholderElm);
  };

  // Add Song
  var addSong = function(songObj, idx){
    api.getSongs({"id": songObj.id}, function(data){
      var songElm = $('<li />');
      songElm.addClass('song');
      songElm.text(songObj.name);
      $('section#playlist ol').append(songElm);
    });
    playSong(songObj.id);
  };

  // Play Song
  var playSong = function(id){
    //if id
    if(id){
      api.getSongs({"id": id}, function(data){
        console.log('data = ');
        console.log(data);
        $('document').ready(function(){
          $('#main').remove('.player');
          $('#main').append(createPlayerElm(data));
        });
      });
    }
  };

  // Add event listeners and bindings
  $('document').ready(function(){
    $('section#playlist').get()[0].addEventListener('dragover', dragOver, false);
    $('section#playlist').get()[0].addEventListener('drop', drop, false);
  });

  var Playlist = function(){};

  Playlist.prototype = {};

  return Playlist;

})();

// Instansiate module
var playlist = new Playlist();
