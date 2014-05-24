#!/usr/bin/env node
// Command line option parser  
// **options.js** acts as the command line options parser for playlist.js.  
// It handles defaults and `--help` messages, and exports command line options.
var pkgJSON  = require('./package.json'),
    optimist = require('optimist')
                .usage(pkgJSON.description + '\nUsage: $0 [options] [target_directory]')
                .options('h', {
                  alias   : 'help',
                  describe: 'Display this help message'
                })
                .options('b', {
                  describe: 'Launch the default browser',
                  alias   : 'browser'
                })
                .options('p', {
                  describe: 'Port',
                  alias   : 'port',
                  default : '8080'
                })
                .options('log', {
                  describe: 'Log level',
                  default : 'info'
                })
                .options('fmt', {
                  describe: 'Returned audio formats. AND = --fmt=mp3,ogg OR = --fmt=mp3 --fmt=ogg',
                  default : ['mp3', 'ogg']
                }),
    argv     = optimist.argv;

// If help requested, show help and exit
if(argv.help){
  console.log(optimist.help());
  process.exit(code=0);
}

// Set default path to current directory
if(argv._.length === 0){
  argv._.push('.');  
}

// Operate on `fmt` data  
// Make sure it's an array, and set it's exclusivity (and/or) based on 
// the presence of a comma
argv.fmtExclusive = false;
if((typeof argv.fmt) === 'string'){
  argv.fmt = argv.fmt.split(',');
  if(argv.fmt.length > 1){
    argv.fmtExclusive = true;
  }
}

// Export
module.exports = argv;
