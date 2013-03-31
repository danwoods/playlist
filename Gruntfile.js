module.exports = function(grunt) {
  // Project configuration.
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
          isolate : false,
          coverage: "json"
        },
        src: ["test/*.js"]
      }
    }
  });
  // Default task
  grunt.registerTask('default', 'vows');
};
