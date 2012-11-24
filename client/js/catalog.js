/*
 * Catalog element functionality
 */
var Catalog = function(){
    
  var api = new API();

  // Setup drag functionality
  var dragStart = function(e){
    e.dataTransfer.setData('text/plain', '{"id":"'+e.target.getAttribute("id")+'", "type":"'+e.target.className+'"}');
    console.log('drag start');
    console.log(e.target);
  };
  var dragEnd = function(e) {
    // this/e.target is the source node.
    console.log('drag end');
  };
  // Create ordered list
  var makeOL = function(arr){
    var elmClass =  arr[0].resource.toLowerCase(),
        olElm = $('<ol class="'+elmClass+'s" />');
    $.each(arr, function(idx, obj){
      liElm = $('<li id="'+obj.id+'" class="'+elmClass+'" draggable="true"><span class="icon"></span><span>'+obj.name+'</span></li>');
      liElm.get()[0].addEventListener('dragstart', dragStart, false);
      olElm.append(liElm);
    });
    return olElm;
  };

  /* "Getter" functions */
  // Get song data, create ordered list from it, and append it to a passed in element
  var getSongs = function(elm, album_id, song_search_obj){
    api.getSongs({"album_id": elm.attr('id')}, function(data){
      elm.append(makeOL(data)).addClass('expanded');
    });
  };

  // Get album data, create ordered list from it, and append it to a passed in element
  var getAlbums = function(elm, artist_id, album_search_obj){
    api.getAlbums({"artist_id": artist_id}, function(data){
      elm.append(makeOL(data)).addClass('expanded');
    });
  };

  // Bind click events
  $('section#catalog').on('click', 'ol > li.artist > span', function(){
    var artistElm = $(this).parent('.artist');
    if(!artistElm.hasClass('expanded')){
      if(artistElm.children('ol').length === 0){
        getAlbums(artistElm, artistElm.attr('id'));
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

  $('section#catalog').on('click', 'ol > li.album > span', function(){
    var albumElm = $(this).parent('.album');
    if(!albumElm.hasClass('expanded')){
      if(albumElm.children('ol').length === 0){
        // The album id doesn't work as a straight up GET call with restful,
        // so we have to reconstruct the id from it's name here
        getSongs(albumElm, albumElm.text().replace(/,/g, '').replace(/([^._a-zA-Z0-9-]+)/g, '_'));
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

  // Catalog init
  var setupCatalog = function(){ 
    api.getArtists({}, function(data){
      var artistArr = data.artist;
      $('section#catalog').append(makeOL(artistArr));
    });
  };

  $('document').ready(function(){
    setupCatalog();
  });
};

var catalog = new Catalog();
