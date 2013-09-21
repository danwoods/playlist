// Player functionality
var Player = function(elm){

  // Variables
  var self = this;
  self.elm = elm;
  self.$elm = $(elm);
  self.paused = false;

  // Play song. If song passed in, play that. Otherwise, decide whether to play, 
  // pause, or request next song from playlist and play that.
  this.play = function(song){
    // If song not passed in, check if the player is currently playing. 
    // If it is, pause playback. Else if no song passed in and nothing is playing, 
    // check to see if the player is currently paused. If it is, restart playback.
    // If no song passed in and the player is not playing and is not paused, get 
    // the next song from playlist and call this function again with that song.
    if(!song){
      if(self.paused){
        // Restart playback
        document.getElementsByTagName('audio')[0].play();
    
        // Update player element
        self.$elm.addClass('playing');
        
        // Update player object
        self.paused = false;
      }
      else if(document.getElementsByTagName('audio')[0].played.length === 1){
        self.pause();
      }
      else{
        // Play next song from playlist
        self.play(playlist.activateNext());
      }
    }
    // If song passed in, remove current audio souce, 
    // add new audio souce, restart player, and update playlist and player object
    else{
      // Remove current audio source
      $('audio source').remove();

      // Loop through song urls and add them to the audio's source
      for(source in song.urls){
        var sourceElm = $('<source src="'+song.urls[source].url+
                        '" type="'+song.urls[source].format+'" />');
                        console.log(song.urls[source].format);
        $('audio').append(sourceElm);
      }

      // Update player track object
      self.curTrack = song;

      // Update player element
      var titleElm = $(self.elm).find('.title');
      titleElm.find('.song').text(song.name);
      titleElm.find('.album').text(song.album.name);
      titleElm.find('.artist').text(song.album.artist.name);
      self.$elm.addClass('playing');

      // Restart audio
      document.getElementsByTagName('audio')[0].pause();
      document.getElementsByTagName('audio')[0].load();
      document.getElementsByTagName('audio')[0].play();
      
      // Update playlist
      $('#'+song.elm_id).siblings('.song').removeClass('playing');
      $('#'+song.elm_id).addClass('playing');

      // Update page title
      $('head title').text('Playlist - '+song.name);

      // Update player object
      self.paused = false;
    }
  };

  // Play the previous track (defaults to first track)
  this.playPrev = function(){
    // Play previous song from playlist
    self.play(playlist.activatePrev());
  };

  // Play the next track (defaults to first track)
  this.playNext = function(){
    // Play next song from playlist
    self.play(playlist.activateNext());
  };

  // Pause playback
  this.pause = function(){
    // Pause playback
    document.getElementsByTagName('audio')[0].pause();
    
    // Update player object
    self.paused = true;

    // Update player element
    self.$elm.removeClass('playing');
  };

  // Create player element
  var createPlayerElm = function(){
    // Create elements
    var containerElm = $('<div />'),
        audioElm = $('<audio controls autoplay style="display:none;"/>'),
        styleElm = $('<style scoped="scoped">span{display:none}</style>');
        titleElm = $('<div class="title" />'),
        songNameElm = $('<span class="song" />').append(styleElm),
        albumNameElm = $('<span class="album" />').append(styleElm),
        artistNameElm = $('<span class="artist" />').append(styleElm),
        controlsElm = $('<div class="controls" />'),
        playBtn = $('<button title="play" class="play icon"></button>').bind('click', function(){self.play();}),
        prevBtn = $('<button title="previous" class="prev icon"></button>').bind('click', function(){self.playPrev();}),
        nextBtn = $('<button title="next" class="next icon"></button>').bind('click', function(){self.playNext();});
    // Add title elements
    titleElm.append(songNameElm)
            .append(albumNameElm)
            .append(artistNameElm);
    // Add control elements
    controlsElm.append(prevBtn)
               .append(playBtn)
               .append(nextBtn);
    // Add all elements to container
    return containerElm.append(titleElm)
                       .append(audioElm)
                       .append(controlsElm);
  };

  // Init
  var init = function(){
    var playerElm = createPlayerElm();
    $(self.elm).append(playerElm);
  };

  init();
};

var player = new Player('section#player');
