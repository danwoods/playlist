// Playlist module
var Playlist = (function () {

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
    return false;
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
