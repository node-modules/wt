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

var debug = require('debug')('wt');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Watcher;

/**
 * Watcher
 *
 * @param {String|Array} dir, dir fullpath, maybe dir list.
 * @param {Object} [options]
 *  - {Boolean} persistent, indicates whether the process should continue to
 *    run as long as files are being watched, default is `true`
 *  - {Boolean} recursive indicates whether all subdirectories should be watched,
 *    or only the current directory, default is `true`
 */
function Watcher(dirs, options) {
  options = options || {};
  if (options.persistent === undefined) {
    options.persistent = true;
  }
  if (options.recursive === undefined) {
    options.recursive = true;
  }

  if (typeof dirs === 'string') {
    dirs = [dirs];
  }

  var that = this;
  this._watchers = dirs.map(function (dir) {
    return fs.watch(dir, options, that._handle.bind(that, dir));
  });
}

Watcher.watch = function (dirs, options) {
  return new Watcher(dirs, options);
};

util.inherits(Watcher, EventEmitter);

var proto = Watcher.prototype;

proto.close = function () {
  this.removeAllListeners();
  this._watchers.forEach(function (watcher) {
    watcher.close();
  });
  this._watchers = null;
};

proto._handle = function (root, event, name) {
  var that = this;
  // if (name[0] === '/') {
  //   // this shuld be fs.watch bug
  //   debug('[warnning] %s %s: filename should not start with /, root: %s', event, name, root);
  //   return;
  // }

  var fullpath = path.join(root, name);
  debug('%s %s on %s', event, name, root);
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

    if (event === 'change' && info.remove) {
      // this should be a fs.watch bug
      debug('[warnning] %s %s on %s, but file not exists, ignore this', event, name, root);
      return;
    }

    that.emit('all', info);
    if (info.remove) {
      debug('remove %s', fullpath);
      that.emit('remove', info);
    } else if (info.isFile) {
      debug('file %s', fullpath);
      that.emit('file', info);
    } else if (info.isDirectory) {
      debug('dir %s', fullpath);
      that.emit('dir', info);
    }
  });
};
