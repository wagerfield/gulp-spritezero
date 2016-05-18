//------------------------------
// Imports
//------------------------------

var gulp = require('gulp');
var clean = require('gulp-clean');
var sync = require('gulp-sync')(gulp);
var spritezero = require('../index');

//------------------------------
// Constants
//------------------------------

var OUTPUT_PATH = './output';

//------------------------------
// Tasks
//------------------------------

gulp.task('default', sync.sync(['clean', 'spritezero']));

gulp.task('clean', function() {
  return gulp.src(OUTPUT_PATH, { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('spritezero', function() {
  return gulp.src('assets/**/*')
    .pipe(spritezero({ scales: [ 1, 2 ] }))
    .pipe(gulp.dest(OUTPUT_PATH));
});
