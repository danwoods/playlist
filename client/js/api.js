// API module
var API = function () {

  // Default api call, used by all the wrapper functions
  var defaultCall = function(url, requestObj, type, callback){ 
    // Check in localStorage first
    if(requestObj && requestObj.id && localStorage.getItem(requestObj.id)){
      // If found in localStorage, convert stringifed object to object return data
      data = JSON.parse(localStorage.getItem(requestObj.id)); 
      if(callback){
        callback(data);
      }
    }
    // If it's not in localStorage, request it from the server
    else{
      $.getJSON(url, function(data){
        // Clean/filter data
        if(requestObj){
          // Restful doesn't always send back the correct data
          data = _.where(data[type], requestObj);
          // If looking for a particular id, and single item found, return the single item instead of array
          if(requestObj.id && data.length === 1){
            data = data[0];
            // Save the item to localStorage to reduce request to the server
            localStorage.setItem(requestObj.id, JSON.stringify(data));
          }
        }
        // return data
        if(callback){
          callback(data);
        }
      });
    }
  };

  // Wrapper functions
  this.getArtists = function(requestObj, callback){
    defaultCall('/artist', requestObj, 'artist', callback);
  };
  this.getAlbums = function(requestObj, callback){
    defaultCall('/artist/'+requestObj.artist_id+'/album', requestObj, 'album', callback);
  };
  this.getSongs = function(requestObj, callback){
    defaultCall('/song', requestObj, 'song', callback);
  };

};

