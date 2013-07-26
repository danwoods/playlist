// Module/Container for a library of music data  
// **playlist.js** acts as a client-side container for playlist data. 
// It responds to catalog and playlist items being dropped on it, 
// holds data about the current state of the playlist, 
// holds the code for playlist items, and 
// handles updating the view.

// #Contents
// - [Configuration/Setup](#section-4)
// + [Funtions/Objects](#section-6)
//  + [private](#section-7)
//      - [idSanitize](#section-8)
//      - [rsFindOrCreate](#section-9)
//      - [artistFindOrCreate](#section-13)
//      - [albumFindOrCreate](#section-14)
//      - [songFindOrCreate](#section-15)
//  + [public](#section-16)
//      + [Artist](#section-17)
//          - [find](#section-18)
//      + [Album](#section-19)
//          - [find](#section-20)
//      + [Song](#section-21)
//          - [add](#section-22)
//          - [get](#section-25)

/*XXX CURRENT ISSUE is that `dragLeave` on playlist elements causes flickering, but removing it causes styles to be left behind if a drag is released XXX*/
//TODO:
//Fix dragLeave issue w/ plis [May be fixed by adding class/style] [OR add event catching function to each sub-element (I'd rather not fix it by adding a style),  http://stackoverflow.com/questions/814564/inserting-html-elements-with-javascript]
//Revise documentation
//Make plis double-clickable
//Make plis draggable
//Remove dependency on jQuery
//Avoid repetition (mainly for rendering's sake). Allow functions to accept arrays
//Use `self` or remove it
//Use document partials when rendering
//Make active item reflect it in it's  view
//Update build

var Playlist = function(elm){

  // Variables
  var api = new API(),
      self = this,
      items = [],
      $playlist;
  // Helper functions
  var dragOver = function(e){
    if (e.preventDefault) {
      e.preventDefault();
    }
    // Is this neccessary?
    e.dataTransfer.dropEffect = 'move';
            
    return false;
  };
  var drop = function(e) {

    // Make sure nothing else happens
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    var droppedObj = JSON.parse(e.dataTransfer.getData('text/plain'));

    api.buildSongs(droppedObj.type, droppedObj.id, function(data){
      for(var idx = 0; idx < data.length; idx++){
        playlist.addItem(data[idx]);
      }
    });

    // Return false
    return false;
  };
  var updateView = function(){
    var len = items.length,
        idx = 0,
        viewItems = $playlist.find('.song');
    if(viewItems.length === 0 && len > 0){
      $playlist.append(items[0].$elm);
    }
    for(idx; idx < len; idx++){
      if(!viewItems[idx] || (viewItems[idx].getAttribute('id') !== items[idx].id)){
        if(!viewItems[idx]){
          $playlist.append(items[idx].$elm); 
        }
        else{
          items[idx].$elm.insertBefore(viewItems[idx]);
        }
      }
      // Call pli's updateView function
      items[idx].updateView();
    }
  }; 
  var addItem = function(data, idx){
    var pli = new PlaylistItem(data),
        idx = (typeof idx === 'number') ? idx : items.length;

    pli.position = idx;
    items.splice(idx, 0, pli);
    updateView();
  };
  var getItem = function(idx){
    var ret = items;
    if(idx){
      ret = items[idx];
    }
    return ret;
  };
  var getActive = function(){
    // write this better
    var retObj = null;
    for(var i = 0; i < items.length; i++){
      if(items[i].active){
        // should this be it's item?
        retObj = items[0];
        break;
      }
    }
    return retObj;
  };
  var setActive = function(idx){
    // write this better
    var active = null;
    for(var i = 0; i < items.length; i++){
      if(i === idx){
        items[i].active = true;
        items[i].updateView();
        active = items[i];
      }
      else if(items[i].active === true){
        items[i].active = false;
        items[i].updateView();
      }
    }
    return active;
  };
  var activateNext = function(){
    var pliNext = {'data':null},
        active = this.getActive();
    if(active){
      pliNext = this.getItem(active.position + 1);
    }
    else if(items[0]){
      pliNext = items[0];
    }
    if(pliNext){
      this.setActive(pliNext.position); 
    }
    
    return pliNext.data;

  };
  var activatePrev = function(){
    var pliPrev = {'data':null},
        active = this.getActive();
    if(active && active.position > 0){
      pliPrev = this.getItem(active.position - 1);
    }
    else if(items[0]){
      pliPrev = items[0];
    }
    if(pliPrev){
      this.setActive(pliPrev.position); 
    }
    
    return pliPrev.data;

  };
  // Return object
  var playlist = { 
    addItem :     addItem,
    removeItem:   function(idx){},
    getItem:      getItem,
    getActive:    getActive,
    setActive:    setActive,
    activateNext: activateNext,
    activatePrev: activatePrev,
  };

  // Playlist item
  var PlaylistItem = function(data){
    // Helper functions
    // ####Function handler for dragenter
    var dragOver = function(e) {
      // Clear any existing 'dodge' classes
      $('.song').removeClass('dodge');
      // Add class to li element
      var $elm = $(e.target);

      if(!$elm.hasClass('song')){
        $elm.parents('.song').addClass('dodge');
      }
      else{
        $elm.addClass('dodge');
      }
    };
    // ####Function handler for dragleave
    var dragLeave = function(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
      var $elm = $(e.target);

      if(!$elm.hasClass('song')){
        $elm.parents('.song').removeClass('dodge');
      }
      else{
        $elm.removeClass('dodge');
      }
      return false;
    };
    // ####Function handler for drop
    var drop = function(e){
    // Stop the drop event from propagating to the playlist
    if (e.stopPropagation) {
      e.stopPropagation();
    }
      var droppedObj = JSON.parse(e.dataTransfer.getData('text/plain')),
          droppedOnPli = $(e.target).hasClass('song') ? e.target : $(e.target).parents('.song'),
          droppedOnPliIdx = $playlist.find('li').index(droppedOnPli) - 1;

      api.buildSongs(droppedObj.type, droppedObj.id, function(data){
        for(var idx = 0; idx < data.length; idx++){
          playlist.addItem(data[idx], droppedOnPliIdx += 1);
        }
      });

      return false;
    };
    // ####Creates HTML element
    var createStructure = function(songObj){ 
      // Variables
      var songElm = $('<li />'),                                            // Song element
          songName = (songObj.name || 'unknown song name'),                 // Song name
          songAlbumName = (songObj.album.name || 'unknown album'),          // Song album name
          songArtistName = (songObj.album.artist.name || 'unknown artist'), // Song artist name
          songLength = (songObj.length || 'unknown length');                // Song length

      // Setup song element attributes and child elements
      songElm.addClass('song');
      songElm.attr('id', playlistItem.id);
      songElm.attr('data-id', songObj.id);
      songElm.append('<span style="pointer-events: none;" class="song-name" title="'+songName+'">'+songName+'</span>');
      songElm.append('<span style="pointer-events: none;" class="song-album" title="'+songAlbumName+'">'+songAlbumName+'</span>');
      songElm.append('<span style="pointer-events: none;" class="song-artist" title="'+songArtistName+'">'+songArtistName+'</span>');
      songElm.append('<span style="pointer-events: none;" class="song-time" title="'+songLength+'">'+songLength+'</span>');

      // Add event handlers
      songElm.get()[0].addEventListener('dragover', dragOver, true);
      songElm.get()[0].addEventListener('dragleave', dragLeave, true);
      songElm.get()[0].addEventListener('drop', drop, true);

      // Return song element
      return songElm;
    };
    // Return Object
    var playlistItem = {
      id: _.uniqueId('pli-'),
      active: false,
      title: '',
      length: 0,
      position: 0,
      data: {},
      $elm: {},
      updateView: function(){
        this.$elm.removeClass('dodge');
        if(this.active){
          this.$elm.addClass('active');
        }
        else{
          this.$elm.removeClass('active');
        }
      }
    };
    var init = function(data){
      playlistItem.$elm   = createStructure(data);
      playlistItem.data   = data;
      playlistItem.title  = data.name;
    };
    init(data);
    return playlistItem;
  };

  var init = function(elm){
    // Add event listeners and bindings, and create any required elements
    $('document').ready(function(){
      $(elm).get()[0].addEventListener('dragover', dragOver, false);
      $(elm).get()[0].addEventListener('drop', drop, false);
      // Add the list element
      $playlist = $('<ol dropzone="copy string:text/x-example" data-blankslate="Drop Artists/Albums/Songs here"/>');
      $(elm).append($playlist);

    });

  };

  init(elm);
  return playlist;
};
