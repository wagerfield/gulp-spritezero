//------------------------------
// Imports
//------------------------------

var _ = require('lodash');
var path = require('path');
var through = require('through2');
var spritezero = require('spritezero');
var util = require('gulp-util');
var Promise = require('promise');
var PluginError = util.PluginError;
var File = util.File;

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

function error(message) {
  return new PluginError('gulp-spritezero', message);
}

//------------------------------
// Exports
//------------------------------

module.exports = function(options) {

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
  function flush(callback) {
    var stream = this;
    var promises = _.map(options.scales, function(scale) {
      return new Promise(function(resolve, reject) {
        var postfix = scale === 1 ? '' : '@' + scale + 'x';

        // Generate sprite formatted data
        spritezero.generateLayout(graphics, scale, true,
          function(error, data) {
          if (error) reject(error);
          else {

            // Add sdf boolean flag to each sprite object
            _.each(data, function(sprite) { sprite.sdf = options.sdf; });

            // Add formatted JSON file to the stream
            stream.push(new File({
              path: options.name + postfix + '.json',
              contents: new Buffer(JSON.stringify(data, null, 2))
            }));

            // Generate sprite layout data
            spritezero.generateLayout(graphics, scale, false,
              function(error, layout) {
              if (error) reject(error);
              else {

                // Generate sprite image
                spritezero.generateImage(layout,
                  function(error, result) {
                  if (error) reject(error);
                  else {

                    // Add sprite image file to the stream
                    stream.push(new File({
                      path: options.name + postfix + '.png',
                      contents: new Buffer(result)
                    }));

                    // Resolve promise
                    resolve();
                  }
                });
              }
            });
          }
        });
      });
    });

    // Call flush callback when all promises
    // have been resolved or rejected
    Promise.all(promises).then(function(result) {
      callback(null);
    }, function(error) {
      callback(error);
    });
  }

  // Return the stream
  return through.obj(transform, flush);
};
