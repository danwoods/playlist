#!/usr/bin/env node

var fs      = require('fs'),
    ID3     = require('id3'),
    library = require('./library'),
    _       = require('underscore'),
    util    = require('util'),
    http    = require('http'),
    director= require('director'),
    plates  = require('plates');

/*** Functions ***/
/* Function: createHtml
 *
 *  Creates html for client
 *
 *  Parameters:
 *   lib_obj: a full library object
 *
 *  Returns:
 *   a string of html
 */
var createHtml = function(lib_obj){

};

/* Function: parseFile
 *
 *  Parses file for ID3 tags
 *
 *  Parameters:
 *   file - file to be parsed
 *
 *  Returns:
 *   file data
 */
var parseFile = function(file){
  // Variable Declarations
  var id3File,      // the file as read in from the file system
      id3Obj  = {}, // the file as read by the ID3 module
      id3Tags = {}, // object to hold the tags if file is using ID3 v1
      retObj  = {}; // return object

  // If a file was passed in, and jen is neat
  if(file){
    // Read it in from the filesystem
    id3File = fs.readFileSync(file);
    // Create an ID3 object out of it
    id3Obj  = new ID3(id3File);
    // Extract ID3 tags
    id3Tags = id3Obj.getTags();

    // Check to see if the tags were extracted correctly
    // If they were, save tags to the return object
    if(id3Tags.artist){
      retObj = id3Tags;
    }
    // If they weren't, parse the ID3 file to try and extract the data
    else{
      id3Obj.parse();
      retObj.title   = id3Obj.get('title');
      retObj.artist  = id3Obj.get('artist');
      retObj.album   = id3Obj.get('album');
      retObj.year    = id3Obj.get('year');
      retObj.comment = id3Obj.get('comment');
      retObj.track   = id3Obj.get('track');
      retObj.genre   = id3Obj.get('genre');
    }
  }

  // Return tags
  return retObj;

}

/* Function: scanFiles
 *
 *  Recursively traverses files in a given path and parses/adds to the library the mp3s
 *
 *  Parameters:
 *   currentPath - path to traverse
 */
var scanFiles = function (currentPath) {
  // Variables
  var files = fs.readdirSync(currentPath),  // the current path
      id3Obj = {};                          // id3 data

  // Loop through the files/directories in tthe current path
  for (var i in files) {
    // Local variables
    var currentFile = currentPath + '/' + files[i], // the path to the current file
        stats = fs.statSync(currentFile);           // the data for the current file

    // If the file is actually a file and it ends in .mp3
    if (stats.isFile() && /mp3$/.test(currentFile)) {
      // Get the id3 data from the file
      id3Obj = parseFile(currentFile);
      // Add the url to the id3 data
      id3Obj.url = currentFile;
      // Add the artist
      library.add_artist(id3Obj.artist);
      // Add the album
      library.add_album({"artist":id3Obj.artist, "album":id3Obj.album});
      // Add the song
      library.add_song(id3Obj);
    }
    // Else if the file is actually a directory
    else if (stats.isDirectory()) {
      // Recursively call scanFiles
      scanFiles(currentFile);
    }
  }
};

/*** Operations ***/
// Recursively scan the files for the given directory, or use the one we're currently in
scanFiles(process.argv[2] || '..');

// Create template
//var artist_list = "<% _.each(artists, function(elm) { %> <div><%= elm.artist %></div> <% }); %>";
//var album_list = "<% _.each(albums, function(elm) { %> <div><%= elm.album %></div> <% }); %>";
//var album_list = "<% _.each(songs, function(elm) { %> <div><%= elm.song %></div> <% }); %>";

// Start Server
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  //var artist_tmpl = _.template(artist_list, {artists: library.get().artists});
  //var album_tmpl = _.template(album_list, {albums: library.get().artists[0].albums});
  //var song_tmpl = _.template(song_list, {songs: library.get().artists[0].albums});
  res.end(artist_tmpl+album_tmpl);
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
console.log('lib = ');
console.log(JSON.stringify(library.get()));
//console.log(_.template(list, {artists: library.get().artists}));

