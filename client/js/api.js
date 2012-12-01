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
    $.getJSON('/artist/'+requestObj.artist_id+'/album', function(data){
      // Restful doesn't always send back the correct data
      data = _.where(data.album, requestObj);
      if(callback){
        callback(data);
      }
    });
  };
  this.getSongs = function(requestObj, callback){
    console.log(requestObj);
    if(requestObj.id && localStorage.getItem(requestObj.id)){
      data = JSON.parse(localStorage.getItem(requestObj.id)); 
      if(callback){
        callback(data);
      }
    }
    else{
      $.getJSON('/song', function(data){
        // Restful doesn't always send back the correct data
        data = _.where(data.song, requestObj);
        // If looking for a particular id, and single item found, return the single item instead of array
        if(requestObj.id && data.length === 1){
          data = data[0];
          localStorage.setItem(requestObj.id, JSON.stringify(data));
        }
        if(callback){
          callback(data);
        }
      });
    }
  };

};

