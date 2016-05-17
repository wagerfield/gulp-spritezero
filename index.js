var through = require('through2');

function doSomethingWithTheFile(file) {
  console.log(file);
}

module.exports = function() {
  return through.obj(function(file, encoding, callback) {
    callback(null, doSomethingWithTheFile(file));
  });
};
