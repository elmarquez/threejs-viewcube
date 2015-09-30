'use strict';

module.exports = function(grunt) {
  grunt.registerTask('serve',
    'Serve the application from the localhost.',
    ['connect:dev:keepalive']
  );
};
