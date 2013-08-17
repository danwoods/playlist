// Module/Container for a library of music data  
// **playlist.js** acts as a client-side container for playlist data. 
// It responds to catalog and playlist items being dropped on it, 
// holds data about the current state of the playlist, and 
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

//TODO:
//Revise documentation
//  Playlist
//    config/setup
//    ui
//    functions
//    return object
//Change this file to be playlist.js
//Avoid creation of return object. Use this/self and vars
//Remove position updating from the playlist's `updateView` function
//Make active item reflect it in it's view
//Make document partial creating function to create all elements and accept arguments like `bubbleEvents` [http://stackoverflow.com/questions/814564/inserting-html-elements-with-javascript]
//Remove dependency on jQuery
//Avoid repetition (mainly for rendering's sake). Allow functions to accept arrays
//Use `self` or remove it
//Revise documentation
//Update build

var Playlist = function(elm){

  //
  // #Configuration/Setup#
  //

  // Variables
  var api = new API(),
      self = this,
      items = [],
      $playlist;

  //
  // #Event Handlers#
  //

  // ##Function: dragOver(e)
  //    Prevents default functionality  
  // **params**:  
  //    `e`: [event]  
  // **returns**:  
  //    false
  var dragOver = function(e){
    if (e.preventDefault) {
      e.preventDefault();
    }
    //XXX Is this neccessary? XXX//
    e.dataTransfer.dropEffect = 'move';
            
    return false;
  };

  // ##Function: drop(e)
  //    Handles items being dropped on the playlist  
  // **params**:  
  //    `e`: [event]  
  // **returns**:  
  //    false
  var drop = function(e) {
    
    // Variables
    var droppedPliIdx = e.dataTransfer.getData('application/playlistItem-index'),
        droppedObjStr = e.dataTransfer.getData('text/plain'),
        droppedObj    = {};

    // Stop the propagation of the event
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    // If the event had playlistItem-index data, move the playlist item 
    // from the specified index to the end of the playlist
    if(droppedPliIdx){
      playlist.moveItem(droppedPliIdx, items.length + 1);
    }
    // Else, parse `text/plain` data to get dropped object data, 
    // build song objects from that data, and append them to the end of the playlist
    else{
      droppedObj = JSON.parse(droppedObjStr);
      api.buildSongs(droppedObj.type, droppedObj.id, function(data){
        for(var idx = 0; idx < data.length; idx++){
          playlist.addItem(data[idx]);
        }
      });
    }

    // Return false
    return false;
  };

  //
  // #Functions#
  //
  
  // ##Function: updateView()
  //    Updates the DOM elements to reflect the playlist  
  // **params**:  
  //    none  
  // **returns**:  
  //    nothing
  var updateView = function(){

    // Variables
    var len = items.length,
        idx = 0,
        viewItems = $playlist.find('.song'),
        clean = true;

    //XXX Why do I need this?
    if(viewItems.length === 0 && len > 0){
      $playlist.append(items[0].$elm);
    }

    // Loop through the playlist items.
    for(idx; idx < len; idx++){
      // If there's no corresponding 
      // view item, add the playlist item's element to the end of 
      // the playlist element
      if(!viewItems[idx]){
        $playlist.append(items[idx].$elm); 
      }
      // Else if the view item id does not match the playlist item id
      // insert the playlist item in front of the view item, and update 
      // the view item array so stays current when comparing ids
      else if (viewItems[idx].getAttribute('id') !== items[idx].id){
        //XXX There's probably a better way to solve this
        clean = false;
        items[idx].$elm.insertBefore(viewItems[idx]);
        viewItems.splice(idx - 1, 0, null);
      }
      //XXX This should not be here.
      //XXX This should only affect the view
      // Update pli's position
      items[idx].position = idx;
      // Call pli's updateView function
      items[idx].updateView();
    }

    // Remove any remaining view items
    for(idx; idx < viewItems.length; idx++){
      $(viewItems[idx]).remove();
    }

    //XXX There's probably a better way to solve this
    if(!clean){
      updateView();
    }

  };

  // ##Function: addItem(data, idx)
  //    Adds an item (exisitng playlist item, or a newly created 
  //    one from the passed in `data`) to the playlist  
  // **params**:  
  //    `data`: [{playlist item || data to create playlist item}] 
  //    `idx` : [number; if `undefined`, item is added at the end]   
  // **returns**:  
  //    nothing
  var addItem = function(data, idx){

    // Get the playlist item and index
    var pli = (data.type === 'playlistItem') ? data : new PlaylistItem(data, playlist),
        idx = (typeof idx === 'number') ? idx : items.length;

    // Set playlist item's position'
    pli.position = idx;

    // Add the item to the playlist at `idx`
    items.splice(idx, 0, pli);

    // update the view
    updateView();

  };

  // ##Function: removeItem(idx)
  //    Removes an item from the playlist  
  // **params**:  
  //    `idx` : [number]   
  // **returns**:  
  //    the removed playlist item
  var removeItem = function(idx){

    // Remove and save the item
    var item = items.splice(idx, 1)[0];

    // Update the view
    updateView();

    // Return the item
    return item;

  };

  // ##Function: moveItem(from, to)
  //    Moves an item in the playlist  
  // **params**:  
  //    `from` : [number]   
  //    `to`   : [number]   
  // **returns**:  
  //    nothing
  var moveItem = function(from, to){

    // Remove item
    var item = removeItem(from);

    // And add it back
    // If moving further down the playlist, 
    // adjust it's destination to account for it's removal
    if(from < to){
      items.splice((to - 1), 0, item);
    }
    // Else just add it at the specified `to` index
    else{
      items.splice(to, 0, item);
    }

    // Update the view
    updateView();

  };

  // ##Function: getItem(idx)
  //    Retrieves an item from the playlist  
  // **params**:  
  //    `idx` : [number]   
  // **returns**:  
  //    the item at the requested `idx` or the 
  //    entire playlist, if `idx` is undefined
  var getItem = function(idx){

    // Assume no `idx` was passed in
    var ret = items;

    // If `idx` was passed in, use the item at that 
    // index for the return value
    if(idx){
      ret = items[idx];
    }

    // Return
    return ret;

  };
  var getActive = function(){
    // write this better
    var retObj = null;
    for(var i = 0; i < items.length; i++){
      if(items[i].active){
        // XXX should this be it's item?
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
  var itemStartDrag = function(idx){
    item = playlist.removeItem(idx);
    playlist.dragging[item.id] = item;
  };

  // Return object
  var playlist = { 
    addItem:      addItem,
    moveItem:     moveItem,
    removeItem:   removeItem,
    getItem:      getItem,
    getActive:    getActive,
    setActive:    setActive,
    activateNext: activateNext,
    activatePrev: activatePrev,
    dragging:     {},
    itemStartDrag:itemStartDrag,
    updateView:   updateView
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
  // Playlist item
  var PlaylistItem = function(data, playlist){
    var api = new API();
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
    // Make sure we're actually dealing with the pli 
    // and not an event from a child element 
    if($elm.hasClass('song')){
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
      var droppedObjStr   = e.dataTransfer.getData('text/plain'),
          droppedPliIdx   = e.dataTransfer.getData('application/playlistItem-index'),
          droppedOnPli    = $(e.target).hasClass('song') ? e.target : $(e.target).parents('.song'),
          droppedOnPliIdx = $(droppedOnPli).parents('ol').find('li').index(droppedOnPli),
          droppedObj      = {};
      if(droppedPliIdx){
        playlist.moveItem(droppedPliIdx, droppedOnPliIdx);
      }
      else{
        droppedObj = JSON.parse(droppedObjStr);
        api.buildSongs(droppedObj.type, droppedObj.id, function(data){
          for(var idx = 0; idx < data.length; idx++){
            playlist.addItem(data[idx], droppedOnPliIdx);
            droppedOnPliIdx++;
          }
        });
      }

      return false;
    };
    // ####Function handler for drag start
    var dragStart = function(e){
      e.dataTransfer.setData('application/playlistItem-index', playlistItem.position);
    };
    // ####Function handler for double click
    var doubleClick = function(e){
      // Stop the drop event from propagating to the playlist
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      activate();
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

      // Setup song element attributes
      songElm.addClass('song');
      songElm.attr('id', playlistItem.id);
      songElm.attr('data-id', songObj.id);
      songElm.attr('draggable', 'true');

      // Add child elements
      songElm.append('<span class="song-name" title="'+songName+'">'+songName+'</span>');
      songElm.append('<span class="song-album" title="'+songAlbumName+'">'+songAlbumName+'</span>');
      songElm.append('<span class="song-artist" title="'+songArtistName+'">'+songArtistName+'</span>');
      songElm.append('<span class="song-time" title="'+songLength+'">'+songLength+'</span>');

      // Add event handlers
      songElm.get()[0].addEventListener('dragover', dragOver, true);
      songElm.get()[0].addEventListener('dragleave', dragLeave, true);
      songElm.get()[0].addEventListener('dragstart', dragStart, true);
      songElm.get()[0].addEventListener('drop', drop, true);
      songElm.get()[0].addEventListener('dblclick', doubleClick, true);

      // Return song element
      return songElm;
    };
    var activate = function(){
      player.play(playlistItem.data);
      playlistItem.active = true;
      playlist.updateView();
    };
    var updateView = function(){
      this.$elm.removeClass('dodge');
      if(this.active){
        this.$elm.addClass('active');
      }
      else{
        this.$elm.removeClass('active');
      }
    };
    // Return Object
    var playlistItem = {
      id:       _.uniqueId('pli-'),
      active:   false,
      activate: activate,
      title:    '',
      length:   0,
      position: 0,
      data:     {},
      $elm:     {},
      type:     'playlistItem',
      updateView: updateView
    };
    var init = function(data){
      playlistItem.$elm   = createStructure(data);
      playlistItem.data   = data;
      playlistItem.title  = data.name;
    };
    init(data);
    return playlistItem;
  };
