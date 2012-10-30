/*
 * Catalog element functionality
 */

// Create ordered list
var makeOL = function(arr){
  var elmClass =  arr[0].resource.toLowerCase(),
      olElm = $('<ol class="'+elmClass+'s" />');
  $.each(arr, function(idx, obj){
    liElm = $('<li id="'+obj.id+'" class="'+elmClass+'"><span class="icon"></span><span>'+obj.name+'</span></li>');
    olElm.append(liElm);
  });
  return olElm;
};

// Get song data, create ordered list from it, and append it to a pasted in element
var getSongs = function(elm, album_id, song_search_obj){
  $.getJSON('/album/'+album_id+'/song', function(data){
    var songArr =_.where(data.song, {album_id: elm.attr('id')});
    elm.append(makeOL(songArr)).addClass('expanded');
  });
};

// Get album data, create ordered list from it, and append it to a pasted in element
var getAlbums = function(elm, artist_id, album_search_obj){
  $.getJSON('/artist/'+artist_id+'/album', function(data){
    var albumArr =_.where(data.album, {artist_id: artist_id});
    elm.append(makeOL(albumArr)).addClass('expanded');
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
  $.getJSON('/artist', function(data){
    var artistArr = data.artist;
    console.log(artistArr);
    $('section#catalog').append(makeOL(artistArr));
  });
};

$('document').ready(function(){
  setupCatalog();
});
