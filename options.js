#!/usr/bin/env node
/* TODO:
 *  - setup to work with playlist
*/

var pkgJSON  = require('./package.json'),
    optimist = require('optimist')
                .usage(pkgJSON.description + '\nUsage: $0')
                .options('h', {
                  alias: 'help',
                  describe: 'Display this help message',
                })
                .options('b', {
                  describe: 'Launch the default browser',
                  alias   : 'browser',
                })
                .options('log', {
                  describe: 'Log level',
                  default : {'info':true},
                })
                .options('fmt', {
                  describe: 'Returned audio formats. AND = --fmt=mp3,ogg OR = --fmt=mp3 --fmt=ogg',
                  default : 'mp3',
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

// Set query type
// Array.isArray(fmt)
if(((typeof argv.fmt) === 'string')){
  argv.fmt = argv.fmt.split(',');
}

// Export
module.exports = argv;
