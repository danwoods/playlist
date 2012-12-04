// Player functionality
var Player = function(elmSel){

    this.play = function(song){
      console.log('clicked play');
      if(!song){
        playlist.getNextSong(function(song){
          player.play(song);
        });
      }
      else{
        for(source in song.urls){
          var songElm = $('<source src="'+song.urls[source].url+
                          '" type="audio/'+song.urls[source].format+'" />');
          $('audio').remove('source').append(songElm);
        }
      }
    };

    // Create player element
    var createPlayerElm = function(){
      var containerElm = $('<div />');
      var audioElm = $('<audio controls autoplay style="display:none;"/>');
      var controlsElm = $('<div class="controls" />');
      var playBtn = $('<button>Play</button>').bind('click', function(){player.play()});
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
