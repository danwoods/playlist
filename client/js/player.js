// Player functionality
var Player = function(elmSel){

  // Variables
  var self = this;

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

        // Restart audio
        document.getElementsByTagName('audio')[0].pause();
        document.getElementsByTagName('audio')[0].load();
        document.getElementsByTagName('audio')[0].play();
        
        // Update playlist
        $('#'+song.elm_id).siblings('.song').removeClass('playing');
        $('#'+song.elm_id).addClass('playing');
      }
    };

    // Create player element
    var createPlayerElm = function(){
      var containerElm = $('<div />');
      var audioElm = $('<audio controls autoplay style="display:none;"/>');
      var controlsElm = $('<div class="controls" />');
      var playBtn = $('<button>Play</button>').bind('click', function(){self.play()});
      controlsElm.append(playBtn)
                 .append('<button>Next</button>');
      return containerElm.append(audioElm).append(controlsElm);
    };

    var init = function(){
      var playerElm = createPlayerElm();
      $(elmSel).append(playerElm);
    };

    init();
};

var player = new Player('section#player');
