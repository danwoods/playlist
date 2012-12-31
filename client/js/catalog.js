/*
 * Catalog element functionality
 */
var Catalog = function(){
  
  // Create a local API instance
  var api = new API();

  /* UI */
  // Drag/drop functionality
  var dragStart = function(e){
    var songObj = {
      "id": e.target.getAttribute("data-id"),
      "type": e.target.getAttribute("data-type"),
      "name": $(e.target).find(".name").text()
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(songObj));
  };

  // Create ordered list from array
  var makeOL = function(arr){
    var itemType = arr[0].resource.toLowerCase(),
        olElm = $('<ol class="'+itemType+'s" />');
    $.each(arr, function(idx, obj){
      var liElm = $('<li id="'+obj.id+'" class="'+itemType+'" data-id="'+obj.id+'" data-type="'+itemType+'" draggable="true"><span class="icon"></span><span class="name">'+obj.name+'</span></li>');
      liElm.get()[0].addEventListener('dragstart', dragStart, false);
      olElm.append(liElm);
    });
    return olElm;
  };

  // Bind click events for artist
  $('section#catalog').on('click', 'ol > li.artist > span', function(){
    var artistElm = $(this).parent('.artist');
    if(!artistElm.hasClass('expanded')){
      if(artistElm.children('ol').length === 0){
        getAlbums(artistElm, {"artist_id": artistElm.attr('id')});
      }
      else{
        artistElm.addClass('expanded');
      }
    }
    else{
      artistElm.removeClass('expanded');
    }
    return false;
  });

  // Bind click events for albums
  $('section#catalog').on('click', 'ol > li.album > span', function(){
    var albumElm = $(this).parent('.album');
    if(!albumElm.hasClass('expanded')){
      if(albumElm.children('ol').length === 0){
        getSongs(albumElm, {"album_id": albumElm.attr('id')});
      }
      else{
        albumElm.addClass('expanded');
      }
    }
    else{
      albumElm.removeClass('expanded');
    }
    return false;
  });

  /* "Getter" functions */
  // Get song data, create ordered list from it, and append it to a passed in element
  var getSongs = function(elm, album_id, song_search_obj){
    api.getSongs({"album_id": elm.attr('id')}, function(data){
      elm.append(makeOL(data.song || data)).addClass('expanded');
    });
  };

  // Get album data, create ordered list from it, and append it to a passed in element
  var getAlbums = function(elm, album_search_obj){
    api.getAlbums(album_search_obj, function(data){
      elm.append(makeOL(data.album || data)).addClass('expanded');
    });
  };

  // Get album data, create ordered list from it, and append it to a passed in element
  var getArtists = function(elm, artist_search_obj){
    api.getArtists(artist_search_obj, function(data){
      elm.append(makeOL(data.artist || data)).addClass('expanded');
    });
  };

  /* Init */
  $('document').ready(function(){
    // Get all artists and append them to 'section#catalog'
    getArtists($('section#catalog'));
  });
};

var catalog = new Catalog();
