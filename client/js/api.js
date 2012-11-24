// Playlist module
var API = function () {

  this.getArtists = function(requestObj, callback){
    $.getJSON('/artist', function(data){
      if(callback){
        callback(data);
      }
    });
  };
  this.getAlbums = function(requestObj, callback){
    var cleanData = {};
    $.getJSON('/artist/'+requestObj.artist_id+'/album', function(data){
      // Restful doesn't always send back the correct data
      cleanData = _.where(data.album, requestObj);
      if(callback){
        callback(cleanData);
      }
    });
  };
  this.getSongs = function(requestObj, callback){
    var cleanData = {};
    $.getJSON('/song', function(data){
      // Restful doesn't always send back the correct data
      cleanData = _.where(data.song, requestObj);
      if(callback){
        callback(cleanData);
      }
    });
  };

};

