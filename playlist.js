#!/usr/bin/env node

// **playlist.js** is the main function/app/whatever you want to call it. It sets up the app and controls it.

var fs      = require('fs'),
    ID3     = require('id3'),
    library = require('./library'),
    Model = require('./model'),
    _       = require('underscore'),
    util    = require('util'),
    url     = require('url'),
    http    = require('http'),
    path    = require('path'),
    director= require('director'),
    restful = require('restful'),
    plates  = require('plates');

var mimeTypes = {
                "html": "text/html",
                "jpeg": "image/jpeg",
                "jpg": "image/jpeg",
                "png": "image/png",
                "js": "text/javascript",
                "mp3": "audio/mpeg",
                "ogg": "audio/ogg",
                "css": "text/css",
                "ico": "image/vnd.microsoft.icon"
                };

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
      retObj.name   = id3Obj.get('title');
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
    curStat = fs.lstatSync(filename + '.' + formats[format]);
    if(curStat.isFile()){
      retArr.push({
                    "url":path.resolve(process.cwd(), filename + '.'+formats[format]), 
                    "format":formats[format]
                  });
    }
  }

  return retArr;
};

/* Function: scanFiles
*
*  Recursively traverses files in a given path and parses/adds to the library the mp3s
*
*  Parameters:
*   currentPath - path to traverse
*/
var scanFiles = function (currentPath) {
  //console.log('Starting new scan at: '+currentPath);
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

/*** Routing ***/
// Get single song data
var getSong = function(id){
  console.log('Searching for song with id: '+id);
  library.get_song(id, function(song){ 
    console.log('Returned from library.get_song with');
    console.log(song);
    this.res.writeHead(200, { 'Content-Type': 'application/json' });
    this.res.end(JSON.stringify(song));
  });
};

// Get artist(s) data
var getArtist = function(searchObj){
  console.log('Searching for artist');
  var res = this.res;
  library.get_artist({}, function(results){ 
    console.log('Returned from library.get_artist with');
    console.log(results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  });
};

// Get album data
var getAlbums = function(search_obj){
  console.log('Searching for album');
  var res = this.res;
  library.get_album(search_obj, function(results){ 
    console.log('Returned from library.get_album with');
    console.log(results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  });
};

// Gets entire library data
var getLibrary = function(){
  this.res.writeHead(200, { 'Content-Type': 'application/json' });
  this.res.end(JSON.stringify(library.get()));
};
//
//
// define a routing table.
//
//
var router = restful.createRouter([Model.Artist, Model.Album, Model.Song]);

/*
var router = new director.http.Router({
'/': {
  get: function(){
    this.res.writeHead(200, {'Content-Type': 'text/html'});
    var fileStream = fs.createReadStream('client/index.html');
    fileStream.pipe(this.res);
    }
  },
  '/artists': {
    '/':{
      get: getArtist
    }
  },
  '/song': {
    '/:id': {
      get: getSong
    }
  },
  '/.+\.css$': {
    get: function(){
      var uri = url.parse(this.req.url).pathname;
      this.res.writeHead(200, {'Content-Type': 'text/css'});
      var fileStream = fs.createReadStream('client'+uri);
      fileStream.pipe(this.res);
    }
  },
  '/.+\.js$': {
    get: function(){
      var uri = url.parse(this.req.url).pathname;
      this.res.writeHead(200, {'Content-Type': 'text/css'});
      var fileStream = fs.createReadStream('client'+uri);
      fileStream.pipe(this.res);
    }
  },
  '/.+\.mp3$': {
    get: function(){
      console.log('trying to access '+url.parse(this.req.url).pathname); 
      var uri = url.parse(this.req.url).pathname;
      var filePath = path.resolve(process.cwd(), uri);
      var stat = fs.statSync(filePath);

      this.res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(filePath);
      // We replaced all the event handlers with a simple call to util.pump()
      util.pump(readStream, this.res);
      
      return;
    }
  },
  '/.+\.ogg$': {
    get: function(){
      console.log('trying to access '+url.parse(this.req.url).pathname); 
      var uri = url.parse(this.req.url).pathname;
      var filePath = path.resolve(process.cwd(), uri);
      var stat = fs.statSync(filePath);

      this.res.writeHead(200, {
        'Content-Type': 'audio/ogg',
        'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(filePath);
      
      readStream.pipe(this.res);
      
      return;
    }
  },
  '/:filename':{
    get: function(filename){console.log(filename)}
  }

});
*/

/* Function: serveStatic
*
*  Serves static files (css, mp3). Called when the default api routing has an error.
*
*  Parameters:
*   req - request,
*   res - response
*/
var serveStatic = function(req, res){
  library.get_artists();
  var uri = url.parse(req.url).pathname,
      filename = path.join(process.cwd() + '/client/', uri); // Assume any static files will be in the '/client' directory
  path.exists(filename, function(exists) {
    if(!exists) {
      // this works for mp3s but makes the page really slow to load otherwise
      console.log("path does not exist: " + filename);
      var filePath = path.resolve(process.cwd(), uri);
      var stat = fs.statSync(filePath);

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      return;
    }
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, mimeType);
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
  }); //end path.exists

};

/*** Operations ***/
// Recursively scan the files for the given directory, or use the one we're currently in
scanFiles(process.argv[2] || '..');

// Start Server
http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });
  req.url = decodeURI(req.url);
  router.dispatch(req, res, function (err) {
    if (err) {
      console.log(err);
      serveStatic(req, res);
      return;
    }
  });
  console.log('Served ' + req.url);
}).listen(1337, '0.0.0.0');
console.log('Server running at http://127.0.0.1:1337/');
library.get_artists();
