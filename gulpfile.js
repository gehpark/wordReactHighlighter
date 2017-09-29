var gulp = require('gulp');
var browserify = require('browserify'),
 babelify = require('babelify'),
 notifier = require('node-notifier'),
 source = require('vinyl-source-stream');
gulp.task('build', function () {
  return browserify('./source/app.js')
  .transform(babelify)
  .bundle()
  .on('error', handleError)
  .pipe(source('app.js'))
  .pipe(gulp.dest('./build/'));
});
gulp.task('watch', function () {
  gulp.watch('./source/**/*.js', ['build']);
});
function handleError(err) {
  console.log(err.stack);
  notifier.notify({
    title: 'Build Error',
    message: err.message
  });
  this.emit('end');
}