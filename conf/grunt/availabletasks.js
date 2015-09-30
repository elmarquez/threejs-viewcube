'use strict';

module.exports = {
  all: {
    options: {
      filter: 'exclude',
      tasks: []
    }
  },
  main: {
    options: {
      filter: 'include',
      tasks: ['compile','release','serve']
    }
  }
};
