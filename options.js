#!/usr/bin/env node
/*TODO: 
 *  - set log level
 * */

var pkgJSON  = require('./package.json'),
    optimist = require('optimist')
                .usage(pkgJSON.description + '\nUsage: $0')
                .options('h', {
                  alias   : 'help',
                  describe: 'Display this help message',
                })
                .options('b', {
                  describe: 'Launch the default browser',
                  alias   : 'browser',
                })
                .options('log', {
                  describe: 'Log level',
                  default : 'info',
                })
                .options('fmt', {
                  describe: 'Returned audio formats. AND = --fmt=mp3,ogg OR = --fmt=mp3 --fmt=ogg',
                  default : ['mp3', 'ogg'],
                }),
    argv     = optimist.argv;

// If help requested, show help
if(argv.help){
  console.log(optimist.help());
}

// Default path is current directory
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
