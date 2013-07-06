
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:../package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
              '<%= grunt.template.today("yyyy-mm-dd") %> */'
    },
    lint: {
      all: ['grunt.js', 'api.js', 'js/catalog.js', 'js/playlist_v2.js']
    },
    jshint: {
      option: {
        "bitwise"       : true,     // Prohibit bitwise operators (&, |, ^, etc.).
        "curly"         : true,     // Require {} for every new block or scope.
        "eqeqeq"        : true,     // Require triple equals i.e. `===`.
        "forin"         : true,     // Don't tolerate `for in` loops without `hasOwnPrototype`.
        "immed"         : true,     // Require immediate invocations to be wrapped in parens e.g. `( function(){}() );`
        "latedef"       : true,     // Prohibit variable use before definition.
        "newcap"        : true,     // Require capitalization of all constructor functions e.g. `new F()`.
        "noarg"         : true,     // Prohibit use of `arguments.caller` and `arguments.callee`.
        "noempty"       : true,     // Prohibit use of empty blocks.
        "nonew"         : false,    // Prohibit use of constructors for side-effects.
        "plusplus"      : false,    // Prohibit use of `++` & `--`.
        "regexp"        : true,     // Prohibit `.` and `[^...]` in regular expressions.
        "undef"         : true,     // Require all non-global variables be declared before they are used.
        "strict"        : false,    // Require `use strict` pragma in every file.
        "trailing"      : true,     // Prohibit trailing whitespaces.
        "asi"           : false,    // Tolerate Automatic Semicolon Insertion (no semicolons).
        "boss"          : false,    // Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments.
        "debug"         : false,    // Allow debugger statements e.g. browser breakpoints.
        "eqnull"        : false,    // Tolerate use of `== null`.
        "es5"           : false,    // Allow EcmaScript 5 syntax.
        "esnext"        : false,    // Allow ES.next specific features such as `const` and `let`.
        "evil"          : false,    // Tolerate use of `eval`.
        "expr"          : false,    // Tolerate `ExpressionStatement` as Programs.
        "funcscope"     : false,    // Tolerate declarations of variables inside of control structures while accessing them later from the outside.
        "globalstrict"  : false,    // Allow global "use strict" (also enables 'strict').
        "iterator"      : false,    // Allow usage of __iterator__ property.
        "lastsemic"     : false,    // Tolerat missing semicolons when the it is omitted for the last statement in a one-line block.
        "laxbreak"      : false,    // Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons.
        "laxcomma"      : false,    // Suppress warnings about comma-first coding style.
        "loopfunc"      : false,    // Allow functions to be defined within loops.
        "multistr"      : false,    // Tolerate multi-line strings.
        "onecase"       : false,    // Tolerate switches with just one case.
        "proto"         : false,    // Tolerate __proto__ property. This property is deprecated.
        "regexdash"     : false,    // Tolerate unescaped last dash i.e. `[-...]`.
        "scripturl"     : false,    // Tolerate script-targeted URLs.
        "smarttabs"     : false,    // Tolerate mixed tabs and spaces when the latter are used for alignmnent only.
        "shadow"        : false,    // Allows re-define variables later in code e.g. `var x=1; x=2;`.
        "sub"           : true,     // Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`.
        "supernew"      : false,    // Tolerate `new function () { ... };` and `new Object;`.
        "validthis"     : false,    // Tolerate strict violations when the code is running in strict mode and you use this in a non-constructor function.
        "browser"       : true,     // Standard browser globals e.g. `window`, `document`.
        "couch"         : false,    // Enable globals exposed by CouchDB.
        "devel"         : false,    // Allow development statements e.g. `console.log();`.
        "dojo"          : false,    // Enable globals exposed by Dojo Toolkit.
        "jquery"        : true,     // Enable globals exposed by jQuery JavaScript library.
        "mootools"      : false,    // Enable globals exposed by MooTools JavaScript framework.
        "node"          : false,    // Enable globals available when code is running inside of the NodeJS runtime environment.
        "nonstandard"   : false,    // Define non-standard but widely adopted globals such as escape and unescape.
        "prototypejs"   : false,    // Enable globals exposed by Prototype JavaScript framework.
        "rhino"         : false,    // Enable globals available when your code is running inside of the Rhino runtime environment.
        "wsh"           : false,    // Enable globals available when your code is running as a script for the Windows Script Host.
        "nomen"         : false,    // Prohibit use of initial or trailing underbars in names.
        "onevar"        : false,    // Allow only one `var` statement per function.
        "passfail"      : false,    // Stop on first error.
        "white"         : false,    // Check against strict whitespace and indentation rules.
        "maxerr"        : 100,      // Maximum errors before stopping.
        "predef"        : ["API", "_"],  // API should be predefined
        "indent"        : 2         // Specify indentation spacing
      }
    },
    min: {
      scripts: {
        src: ['<banner>', 'js/api.js', 'js/catalog.js'/*, 'js/playlist.js'*/],
        dest: 'js/scripts.js'
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint min');

};
