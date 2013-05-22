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
                .options('l', {
                  describe: 'Launch the default browser',
                  alias   : 'launchbrowser',
                })
                .options('log', {
                  describe: 'Log level',
                  default : {'info':true},
                })
                .options('fmt', {
                  describe: 'Returned audio formats',
                  default : 'mp3',
                }),
    argv     = optimist.argv;
if(argv.help){
  console.log(optimist.help());
}
exports = optimist.argv;
