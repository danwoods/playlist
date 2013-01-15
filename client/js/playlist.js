// Playlist module
var Playlist = function(elm) {
  
  // Variables
  var api = new API(),
      self = this;

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

    // Add song to playlist
    var songObj = JSON.parse(e.dataTransfer.getData('text/plain'));
    api.buildFull(songObj.id, function(data){
      addSong(data);
    });

    // Return false
    return false;
  };

  // Create Song Element
  var createSongElm = function(songObj){ 

    // Dodge functionality
    var dragOver = function(e){
      // Variables
      var y = e.pageY - $(e.target).offset().top; // Position of object being drug to target

      // Prevent default behavior
      if (e.preventDefault) {
        e.preventDefault();
      }

      // Clear all other dodge classes and add appropriate dodge class to target element
      var tippingPoint = $(e.target).height()/2;
      if(y > tippingPoint){
        $(elm + ' .song').removeClass('dodge-top');
        $(elm + ' .song').removeClass('dodge-bottom');
        $(e.target).addClass('dodge-bottom');
      }
      else{
        $(elm + ' .song').removeClass('dodge-top');
        $(elm + ' .song').removeClass('dodge-bottom');
        $(e.target).addClass('dodge-top');
      }
      return false;
    };

    // Create actual html element
    var createStructure = function(){ 
      // Song element
      var songElm = $('<li />');  // song element
      // Setup song element attributes and child elements
      songElm.addClass('song');
      songElm.attr('id', _.uniqueId('pl-'));
      songElm.attr('data-id', songObj.id);
      songElm.append('<span class="song-name">'+songObj.name+'</span>');
      songElm.append('<span class="song-album">'+songObj.album.name+'</span>');
      songElm.append('<span class="song-artist">'+songObj.album.artist.name+'</span>');
      songElm.append('<span class="song-time">'+songObj.length+'</span>');

      // Add event handlers
      songElm.get()[0].addEventListener('dragover', dragOver, false);

      // Return song element
      return songElm;
    };

    // Create structure to return
    var songElm = createStructure();

    return songElm;
  };

  // Add Song
  var addSong = function(songObj, idx){

    // Create song element
    var songElm = createSongElm(songObj);
    
    // If playlist already has songs, decide where to place the new song
    if($(elm + ' .song').length){
      
      // Variables
      var pivotElm = $(elm + ' .song')[0];  // The element the new song precedes/succeds; defaults to first song

      // Find the last song that dodged
      $(elm + ' .song').each(function(){
        if($(this).hasClass('dodge-top') || $(this).hasClass('dodge-bottom')){
          pivotElm = $(this);
          return false;
        }
      });

      // Place new song based on pivot element's dodge class
      if($(pivotElm).hasClass('dodge-top')){    
        // Add song before pivot element
        songElm.insertBefore(pivotElm);
      }
      else{
        // Add song after pivot element
        songElm.insertAfter(pivotElm);
      }
    }
    // Else playlist is empty, add new song to begining
    else{
      $(elm + ' ol').append(songElm);
    }
    
    // Remove any existing dodge classes from the playlist
    $(elm + ' .song').removeClass('dodge-top');
    $(elm + ' .song').removeClass('dodge-bottom');

  };

  // Get all songs
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

  // Get data of next song to play
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
  
  // Get data of previous song to play
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

  // Init functionality
  var init = function(){
    // Add event listeners and bindings, and create any required elements
    $('document').ready(function(){
      $(elm).get()[0].addEventListener('dragover', dragOver, false);
      $(elm).get()[0].addEventListener('drop', drop, false);
      // Add a containner for the list elements
      $(elm).append('<ol dropzone="copy string:text/x-example" />');
    });
  };

  // Init instance
  init();

};

// Instansiate module
var playlist = new Playlist('section#playlist');
