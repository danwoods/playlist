module.exports = function(grunt) {
  // Project configuration.
  grunt.loadNpmTasks("grunt-docco");
  grunt.loadNpmTasks("grunt-vows");
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
          isolate : true,
          coverage: "json"
        },
        src: ["test/*.js"]
      }
    },
    docco: {
      all: {
        src: ['model.js', 'playlist.js'],
        options: {
          output: 'docs/'
        }
      } 
    }
  });
  // Default task
  grunt.registerTask('default', ['vows', 'docco']);
};
