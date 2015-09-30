module.exports = {
  dist: {
    cwd: 'dist',
    expand: true,
    files: {
      'dist/four.min.js': 'dist/four.js'
    }
  },
  options: {
    mangle: false,
    screwIE8: true,
    sourceMap: true
  }
};
