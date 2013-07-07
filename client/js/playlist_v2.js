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
    e.dataTransfer.dropEffect = 'move';
            
    return false;
  };
  var drop = function(e) {

    // Make sure nothing else happens
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    var droppedObj = JSON.parse(e.dataTransfer.getData('text/plain'));

    // Processw dropped object
    if(droppedObj.type === 'song'){
      // Add song to playlist
      api.buildSong(droppedObj.id, function(data){
        playlist.addItem(data);
      });
    }
    else if(droppedObj.type === 'album'){
      // Add songs to playlist
      api.buildSongsFromAlbum(droppedObj.id, function(data){
        for(var idx = 0; idx < data.length; idx++){
          addSong(data[idx]);
        }
      });
    }
    else if(droppedObj.type === 'artist'){
      // Add songs to playlist
      api.buildSongsFromArtist(droppedObj.id, function(data){
        for(var idx = 0; idx < data.length; idx++){
          addSong(data[idx]);
        }
      });
    }
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
      if(!viewItems[idx] || (viewItems[idx].getAttribute('data-id') !== items[idx].item.id)){
        if(!viewItems[idx]){
          $playlist.append(items[idx].$elm); 
        }
        else{
          items[idx].$elm.insertBefore(viewItems[idx]);
        }
      }
    }
  }; 
  // Return object
  var playlist = { 
    addItem: function(item, idx){
      var pli = new PlaylistItem(item),
          idx = idx || items.length;

      pli.position = idx;
      items.splice(idx, 0, pli);
      updateView();
    },
    removeItem: function(idx){
    },
    setActive: function(idx){
    },
    getItem: function(idx){
    }
  };

  // Playlist item
  var PlaylistItem = function(data){
    // Helper functions
    // ####Function handler for dragenter
    var dragEnter = function(e) {
      // this / e.target is the current hover target.
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
      // this / e.target is previous target element.
      var $elm = $(e.target);

      if(!$elm.hasClass('song')){
        $elm.parents('.song').removeClass('dodge');
      }
      else{
        $elm.removeClass('dodge');
      }
    };
    // ####Function handler for drop
    var drop = function(e){
    // Stop the drop event from propagating to the playlist
    if (e.stopPropagation) {
      e.stopPropagation();
    }
      var droppedObj = JSON.parse(e.dataTransfer.getData('text/plain')),
          droppedOnPli = $(e.target).hasClass('song') ? e.target : $(e.target).parents('.song'),
          droppedOnPliIdx = $playlist.find('li').index(droppedOnPli);
      api.buildSong(droppedObj.id, function(data){
        playlist.addItem(data, droppedOnPliIdx);
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
      songElm.attr('id', _.uniqueId('pl-'));
      songElm.attr('data-id', songObj.id);
      songElm.append('<span class="song-name" title="'+songName+'">'+songName+'</span>');
      songElm.append('<span class="song-album" title="'+songAlbumName+'">'+songAlbumName+'</span>');
      songElm.append('<span class="song-artist" title="'+songArtistName+'">'+songArtistName+'</span>');
      songElm.append('<span class="song-time" title="'+songLength+'">'+songLength+'</span>');

      // Add event handlers
      songElm.get()[0].addEventListener('dragenter', dragEnter, true);
      songElm.get()[0].addEventListener('dragleave', dragLeave, true);
      songElm.get()[0].addEventListener('drop', drop, true);

      // Return song element
      return songElm;
    };
    var updateView = function(){
    };
    // Return Object
    var playlistItem = {
      playing: false,
      title: '',
      length: 0,
      position: 0,
      item: {},
      $elm: {},
      updateView: updateView
    };
    var init = function(data){
      playlistItem.$elm   = createStructure(data);
      playlistItem.item   = data;
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
