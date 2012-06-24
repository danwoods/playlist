#!/usr/bin/env node

var fs = require('fs'),
    ID3 = require('id3'),
    library = require('./library'),
    _ = require('underscore'),
    util = require('util');

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
  //console.log(currentPath);
  var files = fs.readdirSync(currentPath),
      id3Obj = {};
  for (var i in files) {
    var currentFile = currentPath + '/' + files[i];
    var stats = fs.statSync(currentFile);
    if (stats.isFile() && /mp3$/.test(currentFile)) {
      id3Obj = parseFile(currentFile);
      //console.log('Adding '+id3Obj.artist+' to library');
      library.add_artist(id3Obj.artist);
      //console.log('Adding '+id3Obj.album+' to library');
      library.add_album({"artist":id3Obj.artist, "album":id3Obj.album});
      //console.log(parseFile(currentFile));
      library.add_song(id3Obj);
    }
    else if (stats.isDirectory()) {
      scanFiles(currentFile);
    }
  }
};

scanFiles(process.argv[2] || '..');
console.log(library);
