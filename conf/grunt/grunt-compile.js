'use strict';

module.exports = function (grunt) {
  grunt.registerTask('compile', 'Compile a distributable version of the application in /dist.',
    function () {
      grunt.task.run(['jshint:src','clean','copy','concat','uglify']);
    }
  );
};
