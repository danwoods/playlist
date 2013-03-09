// Playlist module
var Playlist = function(elm) {
  
  // Variables
  var api = new API(),
      self = this;

  // ####Function handler for dragover
  var dragOver = function(e){
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
            
    return false;
  };

  // ####Function handler for drop
  var drop = function(e) {
    // this / e.target is current target element.
    if (e.stopPropagation) {
      e.stopPropagation(); // stops the browser from redirecting.
    }
    
    var droppedObj = JSON.parse(e.dataTransfer.getData('text/plain'));

    // Processw dropped object
    if(droppedObj.type === 'song'){
      // Add song to playlist
      api.buildSong(droppedObj.id, function(data){
        addSong(data);
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

  // ###Function: createSongElm(songObj)
  //  Given a song object, creates and returns a playlist ready song HTML element  
  // **params**:  
  //  `songObj` a fully fledged song object  
  // **returns**:  
  //  A playlist ready, HTML element representation of the song
  var createSongElm = function(songObj){ 

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
      $(elm).trigger('drop', e); 
    };

    // ####Creates HTML element
    var createStructure = function(){ 
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

    // Create structure to return
    var songElm = createStructure();

    return songElm;
  };

  // ###Function: addSong(songObj)  
  //  Creates a playlist element from the passed in `songObj` and adds it to the playlist  
  // **params**:  
  //  `songObj` a fully fledged song object  
  var addSong = function(songObj){

    // Variables
    var songElm = createSongElm(songObj), // Song element
        pivotElm;                         // The element preceding/following the element to add
    
    // If playlist already has songs, decide where to place the new song
    if($(elm + ' .song').length){
      // Set pivot element
      pivotElm = $(elm + ' .song')[0];  // The element the new song precedes/succeds; defaults to first song
      // Find the last song that dodged
      $(elm + ' .song').each(function(){
        if($(this).hasClass('dodge')){
          pivotElm = $(this);
          return false;
        }
      });
      // Place new song based on pivot element's dodge class  
      // If pivot element has a class of 'dodge' add song before pivot element
      if($(pivotElm).hasClass('dodge')){    
        songElm.insertBefore(pivotElm);
      }
      // Else, default to adding song after pivot element
      else{
        songElm.insertAfter(pivotElm);
      }
    }
    // Else playlist is empty, add new song to begining
    else{
      $(elm + ' ol').append(songElm);
    }
    
    // Remove any existing dodge classes from the playlist
    $(elm + ' .song').removeClass('dodge');

  };

  // ###Function: getSongs()  
  //  Returns an array of all the songs in the playlist  
  // **returns**:  
  //  An array of songs in the form `[{"song_id": [SONG ID::Str], "elm_id": [ELEMENT ID::Str], "playing": [IS SONG PLAYING?::Bool]}, {...}, ... ]`  
  this.getSongs = function(){
    var songArr = [];

    // Get song elements
    songArr = _.map($(elm).find('.song'), function(elm){
                var $elm = $(elm);  // Get reference to avoid re-creating object
                return {
                         "song_id"  : $elm.attr('data-id'),
                         "elm_id"   : $elm.attr('id'),
                         "playing"  : $elm.hasClass('playing')
                       };
              });

    return songArr;
  };

  // ###Function: getNextSong(callback)  
  //  Passes the next song in the playlist to the callback function  
  // **params**:  
  //  A callback function which is passed a fully fleged song object
  this.getNextSong = function(callback){
    // Variables
    var songArr = self.getSongs(),  // Get all songs in playlist
        idx = 0,                    // Index
        nextSong = songArr[0];      // Default next song is the first song

    // Loop through all the songs, looking for one with a 'playing' class.
    // If the current song has the 'playing' class, set nextSong to the 
    // following song, and stop the loop.
    for(idx; idx < songArr.length-1; idx++){
      if(songArr[idx].playing === true){
        nextSong = songArr[idx+1];
        break;
      }
    }
    // Get additional data for nextSong
    api.getSongs({"id":nextSong.song_id}, function(song_data){
      // Copy over elm id so that the player can mark it as 'playing'
      song_data.elm_id = nextSong.elm_id;
      api.getAlbums({"id":song_data.album_id}, function(album_data){
        song_data.album = album_data;
        api.getArtists({"id":song_data.album.artist_id}, function(artist_data){
          song_data.artist = artist_data; 
          // Return
          if(callback){
            callback(song_data);
          }
        });
      });
    });
  };
  
  // ###Function: getPrevSong(callback)  
  //  Passes the previous song in the playlist to the callback function  
  // **params**:  
  //  A callback function which is passed a fully fleged song object
  this.getPrevSong = function(callback){
    // Variables
    var songArr = self.getSongs(),  // Get all songs in playlist
        idx = 1,                    // Index
        prevSong = songArr[0];      // Default previous song is the first song

    // Loop through all the songs, looking for one with a 'playing' class.
    // If the current song has the 'playing' class, set nextSong to the 
    // following song, and stop the loop.
    for(idx; idx < songArr.length; idx++){
      if(songArr[idx].playing === true){
        prevSong = songArr[idx-1];
        break;
      }
    }
    // Get additional data for prevSong
    api.getSongs({"id":prevSong.song_id}, function(song_data){
      // Copy over elm id so that the player can mark it as 'playing'
      song_data.elm_id = prevSong.elm_id;
      api.getAlbums({"id":song_data.album_id}, function(album_data){
        song_data.album = album_data;
        api.getArtists({"id":song_data.album.artist_id}, function(artist_data){
          song_data.artist = artist_data; 
          // Return
          if(callback){
            callback(song_data);
          }
        });
      });
    });
  };

  // ####Init functionality
  var init = function(){
    // Add event listeners and bindings, and create any required elements
    $('document').ready(function(){
      $(elm).get()[0].addEventListener('dragover', dragOver, false);
      $(elm).get()[0].addEventListener('drop', drop, false);
      // Add a containner for the list elements
      $(elm).append('<ol dropzone="copy string:text/x-example" data-blankslate="Drop Artists/Albums/Songs here"/>');
    });
  };

  // Init instance
  init();

};
