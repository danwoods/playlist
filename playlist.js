#!/usr/bin/env node

// **playlist.js** is the main function/app/whatever you want to call it. It sets up the app and controls it.

var fs      = require('fs'),
    ID3     = require('id3'),
    Model = require('./model'),
    _       = require('underscore'),
    util    = require('util'),
    url     = require('url'),
    http    = require('http'),
    path    = require('path'),
    director= require('director'),
    restful = require('restful'),
    log     = require('winston');

var mimeTypes = {
                "html": "text/html",
                "jpeg": "image/jpeg",
                "jpg" : "image/jpeg",
                "png" : "image/png",
                "js"  : "text/javascript",
                "mp3" : "audio/mpeg",
                "ogg" : "audio/ogg",
                "css" : "text/css",
                "ico" : "image/vnd.microsoft.icon"
                };

// Setup logger
log.remove(log.transports.Console);
log.add(log.transports.Console, {colorize: true});


/*** Functions ***/

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

  // If a file was passed in
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
      retObj.name    = id3Obj.get('title');
      retObj.artist  = id3Obj.get('artist');
      retObj.album   = id3Obj.get('album');
      retObj.year    = id3Obj.get('year');
      retObj.comment = id3Obj.get('comment');
      retObj.track   = id3Obj.get('track');
      retObj.genre   = id3Obj.get('genre');
    }
  }

  return retObj;

};

/* Function: lookForOtherFormats
*
*  Check for other files with the same file name but different extensions
*
*  Parameters:
*   given_filename - the file to extract the file name from
*   formats - acceptable formats
*
*  Returns:
*   an array of the matched files in the style {"url":<String>, "format":<String>}
*/
var lookForOtherFormats = function(given_filename, formats){
  var filename = given_filename.replace(/.([A-z]|[0-9])+$/, ''),
      retArr = [],
      curStat;

  // Loop through formats and check for matching files
  for(format in formats){
    // If a file with the specified format exists
    if(fs.existsSync(filename + '.' + formats[format])){
      // Get it's information
      curStat = fs.lstatSync(filename + '.' + formats[format]);
      // If it's really a file
      if(curStat.isFile()){
        // add it's url and format to the return array
        retArr.push({
                      "url":path.resolve(process.cwd(), filename + '.'+formats[format]), 
                      "format":formats[format]
                    });
      }
    }
  }

  return retArr;
};

/* Function: scanFiles
*
*  Recursively traverses files in a given path and parses/adds to the Model the mp3s
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
      id3Obj.urls = [];
      id3Obj.urls.push({"url":path.resolve(process.cwd(), currentFile), "format":"mpeg"});
      id3Obj.urls = id3Obj.urls.concat(lookForOtherFormats(currentFile, ['ogg']));
      // For now, only add files which have both formats, to improve cross brrowser comaptability
      if(id3Obj.urls.length > 1){
        // Add the song
        Model.add_song(id3Obj);
      }
    }
    // Else if the file is actually a directory
    else if (stats.isDirectory()) {
      // Recursively call scanFiles
      scanFiles(currentFile);
    }
  }
};

/*** Routing ***/
// Get single song data
var getSong = function(id){
  log.info('Searching for song with id: '+id);
  Model.get_song(id, function(song){ 
    log.info('Returned from Model.get_song with');
    log.info(song);
    this.res.writeHead(200, { 'Content-Type': 'application/json' });
    this.res.end(JSON.stringify(song));
  });
};

// Get artist(s) data
var getArtist = function(searchObj){
  log.info('Searching for artist');
  var res = this.res;
  Model.get_artist({}, function(results){ 
    log.info('Returned from Model.get_artist with');
    log.info(results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  });
};

// Get album data
var getAlbums = function(search_obj){
  log.info('Searching for album');
  var res = this.res;
  Model.get_album(search_obj, function(results){ 
    log.info('Returned from Model.get_album with');
    log.info(results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  });
};

// Create router
var router = restful.createRouter([Model.Artist, Model.Album, Model.Song], { explore: false });

/* Function: serveStatic
*
*  Serves static files (css, mp3). Called when the default api routing has an error.
*
*  Parameters:
*   req - request
*   res - response
*/
var serveStatic = function(req, res){
  // Variables
  var uri = decodeURI(url.parse(req.url).pathname),
      clientFileTypeArr = ['js', 'css', 'html', 'ico', 'png', 'jpg', 'jpeg', 'gif'],
      audioFileTypeArr = ['mp3', 'ogg', 'flac'],
      clientPathStr = process.cwd() + '/client/',
      isClientFileType = (clientFileTypeArr.indexOf(uri.split('.').pop()) > -1),
      isAudioFileType = (audioFileTypeArr.indexOf(uri.split('.').pop()) > -1),
      filename = '';

  // Only try to serve/access files which are either client or audio files
  if(isClientFileType || isAudioFileType){
    // Create filename
    filename = (isClientFileType) ? path.join(clientPathStr, uri) : uri; 
    // If requested file exist
    if(!fs.existsSync(filename)){
      log.error("playlist.js::serveStatic, looking for non-existing file '"+filename+"'");
    }
    else{
      var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
      res.writeHead(200, mimeType);
      var fileStream = fs.createReadStream(filename);
      fileStream.pipe(res);
      log.info("playlist.js::serveStatic, served static file '"+filename+"'");
    }
  }

};

/*** Operations ***/
// Recursively scan the files for the given directory, or use the one we're currently in
scanFiles(process.argv[2] || '..');

// Start Server
http.createServer(function (req, res) {
  // Make '/' point to index.html
  if(req.url === '/'){
    req.url = req.url + 'index.html';
    serveStatic(req, res);
  }
  else{
    req.chunks = [];
    req.on('data', function (chunk) {
      req.chunks.push(chunk.toString());
    });
    req.url = decodeURI(req.url);
    router.dispatch(req, res, function (err) {
      if (err) {
        serveStatic(req, res);
        return;
      }
    });
  }
}).listen(1337, '0.0.0.0');
log.info('playlist.js::server running at http://127.0.0.1:1337/');
