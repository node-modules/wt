/**!
 * wt - index.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Watcher;

/**
 * Watcher
 *
 * @param {String} dir
 * @param {Object} [options]
 *  - {Boolean} persistent, indicates whether the process should continue to
 *    run as long as files are being watched, default is `true`
 *  - {Boolean} recursive indicates whether all subdirectories should be watched,
 *    or only the current directory, default is `true`
 */
function Watcher(dir, options) {
  options = options || {};
  if (options.persistent === undefined) {
    options.persistent = true;
  }
  if (options.recursive === undefined) {
    options.recursive = true;
  }

  this._root = dir;
  this._watcher = fs.watch(dir, options, this._handle.bind(this));
}

Watcher.watch = function (dir, options) {
  return new Watcher(dir, options);
};

util.inherits(Watcher, EventEmitter);

var proto = Watcher.prototype;

proto.close = function () {
  this.removeAllListeners();
  this._watcher.close();
  this._watcher = null;
};

proto._handle = function (event, name) {
  var that = this;
  var fullpath = path.join(this._root, name);
  fs.stat(fullpath, function (err, stat) {
    var info = {
      event: event,
      path: fullpath,
      stat: stat,
      remove: false,
      isDirectory: stat && stat.isDirectory() || false,
      isFile: stat && stat.isFile() || false,
    };
    if (err) {
      if (err.code === 'ENOENT') {
        info.remove = true;
      }
    }
    that.emit('all', info);
    if (info.remove) {
      that.emit('remove', info);
    } else if (info.isFile) {
      that.emit('file', info);
    } else if (info.isDirectory) {
      that.emit('dir', info);
    }
  });
};
