module.exports = function(grunt) {
  // Project configuration.
  grunt.loadNpmTasks("grunt-docco");
  grunt.loadNpmTasks("grunt-vows");
  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
              '<%= grunt.template.today("yyyy-mm-dd") %> */'
    },
    vows: {
      all: {
        options: {
          reporter: "spec",
          verbose : true,
          silent  : false,
          colors  : true,
          isolate : false,
          coverage: "json"
        },
        src: ["test/*.js"]
      }
    },
    docco: {
      all: {
        src: ['model.js', 'playlist.js', 'options.js'],
        options: {
          output: 'docs/'
        }
      } 
    },
    jshint: {
      options: {
        curly:  true,
        eqeqeq: true,
        eqnull: true,
        forin:  true,
        indent: 2,
        node:   true,
        noempty:true,
        undef:  true,
        unused: true,
        browser:false
      },
      all: ['model.js']
    }
  });
  // Default task
  grunt.registerTask('default', ['vows', 'docco', 'jshint']);
};
