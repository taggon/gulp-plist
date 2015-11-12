'use strict';

const path = require('path');
const fs = require('fs');
const PluginError = require('gulp-util').PluginError;
const through = require('through2');
const merge = require('deepmerge');
const plist = require('plist');
const bplistParser = require('bplist-parser');
const bplistCreator = require('bplist-creator');
const config = require('./package.json');

const defaults = {
  writeBinary: false
};

function editor(editor, options) {
  var _editor;

  options = Object.assign({}, defaults, options);

  switch(typeof editor) {
    case 'function':
      _editor = function(json){ return editor(json) };
      break;
    case 'object':
      _editor = function(json){ return merge(json, editor) };
      break;
    case 'undefined':
      throw new PluginError(config.name, 'missing `editor` argument');
    default:
      throw new PluginError(config.name, '`editor` must be a function or an object');
  }

  return through.obj(function(file, encoding, callback) {
    var json;

    // ignore null content
    if (file.isNull()) {
      this.push(null);
      return callback();
    }

    // stream is not supported
    if (file.isStream()) {
      this.emit('error', new PluginError(config.name, 'Streaming is not supported'));
      return callback();
    }

    try {
      switch(file.contents.toString('ascii', 0, 6)) {
	case 'bplist':
	  json = bplistParser.parseBuffer(file.contents)[0];
	  break;
	case '<?xml ':
	  json = plist.parse(file.contents.toString('utf8'));
	  break;
	default:
	  throw 'Unknown plist format';
      }
      json = _editor(json);

      let content;
      if (options.writeBinary) {
	content = bplistCreator(json);
      } else {
	content = plist.build(json);
      }
      file.contents = new Buffer(content);
    } catch(err) {
      this.emit('error', new PluginError(config.name, err));
      return callback();
    }

    this.push(file);
    callback();
  });
}

module.exports = editor;
