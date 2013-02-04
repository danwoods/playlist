// API module
var API = function () {

  // Get reference to a global 'this'
  var self = this;

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

  // Build full song object from song_id
  this.buildSong = function(song_id, callback){
    var retObj = {};
    self.getSongs({'id':song_id}, function(songObj){
      retObj = songObj;
      self.getAlbums({'id':retObj.album_id}, function(albumObj){
        retObj.album = albumObj;
        self.getArtists({'id':retObj.album.artist_id}, function(artistObj){
          retObj.album.artist = artistObj;
          if(callback){
            callback(retObj);
          }
        });
      });
    });
  };

  // Build full song object array from album_id
  this.buildSongsFromAlbum = function(album_id, callback){
    var songObjTmpl = {};
    self.getAlbums({'id':album_id}, function(albumObj){
      songObjTmpl.album = albumObj;
      self.getArtists({'id':albumObj.artist_id}, function(artistObj){
        songObjTmpl.album.artist = artistObj;
        self.getSongs({'album_id': songObjTmpl.album.id}, function(songArr){
          if(callback){
            callback(_.map(songArr, function(songObj){return _.defaults(songObj, songObjTmpl);}));
          }
        });
      });
    });
  };
  
  // Build full song object array from artist_id
  this.buildSongsFromArtist = function(artist_id, callback){
    var artistObj   = {},
        songObjTmpl = {},
        totalSongs  = 0,
        retArr      = [];
    self.getArtists({'id':artist_id}, function(artistObj){
      artistObj = artistObj;
      self.getAlbums({'artist_id':artistObj.id}, function(albumArr){
        totalSongs = _.map(albumArr, function(albumObj){return albumObj.song_ids.length}).length;
        for (var i = 0; i < albumArr.length; i++) {
          songObjTmpl.album = albumArr[i];
          songObjTmpl.album.artist = artistObj;
          defaultCall('/album/'+songObjTmpl.album.name.replace(/ /g, '_')+'/song', null, null, function(data){
            retArr = retArr.concat(_.flatten(_.map(data.song, function(songObj){return _.defaults(songObj, songObjTmpl);})));
            if(retArr.length >= totalSongs){
              if(callback){
                callback(retArr);
              }
            }
          });
        };
      });
    });
  };

};

