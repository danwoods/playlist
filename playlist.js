#!/usr/bin/env node

// **playlist.js** is the main function/app/whatever you want to call it. It sets up the app and controls it.

var fs        = require('fs'),
    ID3       = require('id3'),
    Model     = require('./model'),
    _         = require('underscore'),
    util      = require('util'),
    url       = require('url'),
    http      = require('http'),
    path      = require('path'),
    exec      = require('child_process').exec,
    opts      = require('./options'),
    log       = require('./log').logger,
    router    = Model.router,
    port      = opts.port || '8080',
    mimeTypes = {
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
                      "url"   :path.resolve(process.cwd(), filename + '.'+formats[format]), 
                      "format":mimeTypes[formats[format]]
                    });
      }
    }
  }

  return retArr;
};

/* Function: scanFiles
*
*  Recursively traverses files in a given path and parses/adds songs to the Model
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
        stats = fs.statSync(currentFile),           // the data for the current file
        fmtRegex = new RegExp(opts.fmt[0] + '$');   // a regular expression for matching the first format to the end of a filename
    // If the file is actually a file and matches `fmtRegx`
    if (stats.isFile() && fmtRegex.test(currentFile)) {
      // Get the id3 data from the file
      id3Obj = parseFile(currentFile);
      // Add the url to the id3 data
      id3Obj.urls = [];
      id3Obj.urls.push({"url":path.resolve(process.cwd(), currentFile), "format":mimeTypes[opts.fmt[0]]});
      // Search for any of the other formats
      id3Obj.urls = id3Obj.urls.concat(lookForOtherFormats(currentFile, opts.fmt.slice(1)));
      // If file matches the correct format criteria, add it to the Model
      if(id3Obj.urls.length === opts.fmt.length || !opts.fmtExclusive){
        // Add the song
        Model.Song.add(id3Obj, function(err, songObj){
          // Check for error
          if(err){
            log.error('playlist.js::add_song, error when creating song. Error:\n'+JSON.stringify(err,null,2)+'\nsong:\n'+JSON.stringify(id3Obj,null,2));
          }
        });
      }
    }
    // Else if the file is actually a directory
    else if (stats.isDirectory()) {
      // Recursively call scanFiles
      scanFiles(currentFile);
    }
  }
};

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
  var uri               = decodeURI(url.parse(req.url).pathname),
      clientFileTypeArr = ['js', 'css', 'html', 'ico', 'png', 'jpg', 'jpeg', 'gif'],
      audioFileTypeArr  = ['mp3', 'ogg', 'flac'],
      clientPathStr     = process.cwd() + '/client/',
      isClientFileType  = (clientFileTypeArr.indexOf(uri.split('.').pop()) > -1),
      isAudioFileType   = (audioFileTypeArr.indexOf(uri.split('.').pop()) > -1),
      filename          = '';

  // Only try to serve/access files which are either client or audio files
  if(isClientFileType || isAudioFileType){
    // Create filename
    filename = (isClientFileType) ? path.join(clientPathStr, uri) : uri; 
    // If requested file exist
    if(!fs.existsSync(filename)){
      log.error("playlist.js::serveStatic, looking for non-existing file '"+filename+"'");
    }
    else{
      // Get and set the content type for tyhe response
      var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
      res.writeHead(200, {'Content-Type':mimeType});
      // Create and send the filestream
      var fileStream = fs.createReadStream(filename);
      fileStream.pipe(res);
      log.info("playlist.js::serveStatic, served static file '"+filename+"' with mime-type '"+mimeType+"'");
    }
  }

};

/*** Operations ***/
// Recursively scan the files for the given directory, or use the one we're currently in
scanFiles(opts._[0]);

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
}).listen(port, '0.0.0.0');
log.info('playlist.js::server running at http://127.0.0.1:'+port);

// If requested, launch browser
if(opts.browser){
  exec('xdg-open http://127.0.0.1:'+port, function(error, stdout, stderr) {
    if(error){
      log.error(error);
    }
    log.info('launching browser: ' + stdout);
  });
}
