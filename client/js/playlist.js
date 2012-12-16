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

  // Create Song Element
  var createSongElm = function(songObj){ 
    // Song element
    var songElm = $('<li />');  // song element

    // Dodge functionality
    var dragOver = function(e){
      var x = e.pageX - $(e.target).offset().left,
          y = e.pageY - $(e.target).offset().top;

      // Prevent default behavior
      if (e.preventDefault) {
        e.preventDefault();
      }

      // Remove any existing dodge classes from the element
      $(e.target).removeClass('dodge-top');
      $(e.target).removeClass('dodge-bottom');

      // Add appropriate dodge class
      if(y > 0){
        $(e.target).addClass('dodge-bottom');
      }
      else{
        $(e.target).addClass('dodge-top');
      }
      return false;
    };
    var dragLeave = function(e) {
      // Remove any existing dodge classes from the playlist
      $(elm + ' .song').removeClass('dodge-top');
      $(elm + ' .song').removeClass('dodge-bottom');
    };

    // Setup song element attributes and child elements
    songElm.addClass('song');
    songElm.attr('id', _.uniqueId('pl-'));
    songElm.attr('data-id', songObj.id);
    songElm.append('<span class="song-name">'+songObj.name+'</span>');

    // Add event handlers
    songElm.get()[0].addEventListener('dragover', dragOver, false);
    songElm.get()[0].addEventListener('dragleave', dragLeave, false);

    // Return song Element
    return songElm;
  };

  // Add Song
  var addSong = function(songObj, idx){
    // Get data of song to add
    api.getSongs({"id": songObj.id}, function(data){

      // Remove any existing dodge classes from the playlist
      $(elm + ' .song').removeClass('dodge-top');
      $(elm + ' .song').removeClass('dodge-bottom');

      // Create song element
      var songElm = createSongElm(data);

      // Add song to playlist
      $(elm + ' ol').append(songElm);
    });
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
