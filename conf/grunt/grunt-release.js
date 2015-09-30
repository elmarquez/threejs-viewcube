'use strict';

module.exports = function (grunt) {
  grunt.registerTask('release', 'Create and tag a release',
    function () {
      grunt.task.run(['checkbranch:master','bump']);
    }
  );
};
