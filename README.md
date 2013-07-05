Playlist.js
===========

A node.js based audio server/client

To Run
======
````shell
$> node ./playlist [options] [target_directory]
````
where [options] are the command line options listed from the `--help` command:
````shell
$> node playlist.js --help
audio client/server
Usage: node ./playlist.js [options] [target_directory]

Options:
  -h, --help     Display this help message    
  -b, --browser  Launch the default browser    
  --log          Log level                                                             [default: "info"]
  --fmt          Returned audio formats. AND = --fmt=mp3,ogg OR = --fmt=mp3 --fmt=ogg  [default: ["mp3","ogg"]]
````    
and [target_directory] is the directory of the audio files. If no [target_directory] specified, the current directory is used.

Motivation
==========
Mainly to play with node and html5 :) I'm also trying to use as few libraries as possible on the client side, to keep the code as lean and fast as possible.

Demo
====
http://danwoods.playlist.jit.su/

Documentation
=============
docs  
client/docs
