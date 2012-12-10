// Player functionality
var Player = function(elm){

  // Variables
  var self = this;
  self.elm = elm;

    // Play song. If song passed in, play that. Otherwise, request next song 
    // from playlist and play that.
    this.play = function(song){
      // If song not passed in, get next song from playlist 
      // and call this function with that song.
      if(!song){
        playlist.getNextSong(function(song){
          self.play(song);
        });
      }
      // If song passed in, remove current audio souce, 
      // add new audio souce, restart player, and update playlist
      else{
        // Remove current audio source
        $('audio source').remove();

        // Loop through song urls and add them to the audio's source
        for(source in song.urls){
          var sourceElm = $('<source src="'+song.urls[source].url+
                          '" type="audio/'+song.urls[source].format+'" />');
          $('audio').append(sourceElm);
        }

        // Update player display
        var titleElm = $(self.elm).find('.title');
        titleElm.find('.song').text(song.name);
        titleElm.find('.album').text(song.album.name);
        titleElm.find('.artist').text(song.artist.name);

        // Restart audio
        document.getElementsByTagName('audio')[0].pause();
        document.getElementsByTagName('audio')[0].load();
        document.getElementsByTagName('audio')[0].play();
        
        // Update playlist
        $('#'+song.elm_id).siblings('.song').removeClass('playing');
        $('#'+song.elm_id).addClass('playing');
      }
    };

    // Play the previous track (defaults to first track)
    this.playPrev = function(){
      playlist.getPrevSong(function(song){
        self.play(song);
      });
    };

    // Play the next track (defaults to first track)
    this.playNext = function(){
      playlist.getNextSong(function(song){
        self.play(song);
      });
    };

    // Create player element
    var createPlayerElm = function(){
      // Create elements
      var containerElm = $('<div />'),
          audioElm = $('<audio controls autoplay style="display:none;"/>'),
          titleElm = $('<div class="title" />'),
          songNameElm = $('<span class="song" />'),
          albumNameElm = $('<span class="album" />'),
          artistNameElm = $('<span class="artist" />'),
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
