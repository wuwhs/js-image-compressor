if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/image-compressor.min.js')
} else {
  module.exports = require('./dist/image-compressor.js')
}