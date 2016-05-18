'use strict';

//------------------------------
// Imports
//------------------------------

var _ = require('lodash');
var path = require('path');
var through = require('through2');
var spritezero = require('spritezero');
var util = require('gulp-util');
var File = require('vinyl');
var PluginError = util.PluginError;

//------------------------------
// Constants
//------------------------------

var DEFAULTS = {
  scales: [1, 2],
  name: 'sprite',
  sdf: false
};

//------------------------------
// Helpers
//------------------------------

const error = message => new PluginError('gulp-spritezero', message);

//------------------------------
// Exports
//------------------------------

module.exports = options => {

  // Build options
  options = _.assign({}, DEFAULTS, options);

  // Create data store
  var graphics = [];

  // Transform stream
  function transform(file, encoding, callback) {
    var filepath = path.parse(file.relative);

    // File is null
    if (file.isNull()) {
      return callback(null, file);

    // File is a stream
    } else if (file.isStream()) {
      this.emit('error', error('Streams not supported'));

    // File is a buffer
    } else if (file.isBuffer()) {
      if (filepath.ext === '.svg') {
        graphics.push({
          svg: file.contents,
          id: filepath.name
        });
      }
      return callback(null);
    }
  }

  // Flush stream
  function flush() {
    var stream = this;
    _.each(options.scales, scale => {
      var postfix = scale === 1 ? '' : `@${scale}x`;

      // Generate sprite formatted data
      spritezero.generateLayout(graphics, scale, true, (error, data) => {

        // Add sdf boolean flag to each sprite object
        _.each(data, sprite => sprite.sdf = options.sdf);

        // Add formatted JSON data to the stream
        stream.push(new File({
          path: `${options.name}${postfix}.json`,
          contents: new Buffer(JSON.stringify(data, null, 2))
        }));

        // Generate sprite layout data
        spritezero.generateLayout(graphics, scale, false, (error, layout) => {

          // Generate sprite image
          spritezero.generateImage(layout, (error, result) => {

            // Add sprite image to the stream
            stream.push(new File({
              path: `${options.name}${postfix}.png`,
              contents: new Buffer(result)
            }));
          });
        });
      });
    });
  }

  // Return the stream
  return through.obj(transform, flush);
};
