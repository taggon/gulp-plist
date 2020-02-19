# gulp-plist [![Build Status](https://travis-ci.org/taggon/gulp-plist.svg?branch=master)](https://travis-ci.org/taggon/gulp-plist)

gulp-plist is a [gulp](https://github.com/gulpjs/gulp) plugin modifies Mac OS Plist (property list) files which are often used in OS X and iOS applications.
It can read/write both binary and plain xml plist format.

## Install
```
$ npm install --save-dev gulp-plist
```

## Usage

```js
const gulp = require('gulp');
const plist = require('gulp-plist');

gulp.task('default', () => {
  return gulp.src('src/Info.plist')
    .pipe(plist({
      CFBundleDisplayName: 'My App'
    })
    .pipe(gulp.dest('dist'));
});
```

Or, you can pass a modifier function to the plugin:

```js
const gulp = require('gulp');
const plist = require('gulp-plist');

gulp.task('default', () => {
  return gulp.src('src/Info.plist')
    .pipe(plist(json => {
      json.CFBundleDisplayName = 'My App';
      return json;
    })
    .pipe(gulp.dest('dist'));
});
```

The plugin takes an optional second argument that represents settings.
Currently only `writeBinary` option is supported. If you want to write binary plist files, set the option to `true`. The default value is `false`.

```js
const gulp = require('gulp');
const plist = require('gulp-plist');

gulp.task('default', () => {
  return gulp.src('src/Info.plist')
    .pipe(plist({
      CFBundleDisplayName: 'My App'
    }, {
      writeBinary: true
    })
    .pipe(gulp.dest('dist'));
});
```

## License

MIT © [Taegon Kim](http://taegon.kim)
