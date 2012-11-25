// API module
var API = function () {

  this.getArtists = function(requestObj, callback){
    $.getJSON('/artist', function(data){
      if(requestObj){
        data = _.where(data.artist, requestObj);
      }
      //console.log(data):
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
      // If looking for a particular id, and single item found, return the single item instead of array
      if(requestObj.id && cleanData.length === 1){
        cleanData = cleanData[0];
      }
      if(callback){
        callback(cleanData);
      }
    });
  };

};

