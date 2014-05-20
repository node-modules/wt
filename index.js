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
var ndir = require('ndir');

module.exports = Watcher;

/**
 * Watcher
 *
 * @param {String|Array} dir, dir fullpath, maybe dir list.
 */
function Watcher(dirs, done) {
  // http://nodejs.org/dist/v0.11.12/docs/api/fs.html#fs_caveats
  // The recursive option is currently supported on OS X.
  // Only FSEvents supports this type of file watching
  // so it is unlikely any additional platforms will be added soon.

  this.options = {
    persistent: true,
    recursive: false, // so we dont use this features
  };

  if (typeof dirs === 'string') {
    dirs = [dirs];
  }

  this._watchers = {};
  dirs.forEach(this.watch.bind(this));

  var index = 0;
  var that = this;
  dirs.forEach(function (dir) {
    that.once('watch-' + dir, function () {
      if (++index === dirs.length) {
        debug('watch %j ready', dirs);
        done && done();
      }
    });
  });
}

Watcher.watch = function (dirs, done) {
  return new Watcher(dirs, done);
};

util.inherits(Watcher, EventEmitter);

var proto = Watcher.prototype;

proto.watch = function (dir) {
  var watchers = this._watchers;
  var that = this;
  debug('walking %s...', dir);
  ndir.walk(dir).on('dir', function (dirpath) {
    if (watchers[dirpath]) {
      debug('fs.watch %s exists', dirpath);
      return;
    }
    debug('fs.watch %s start...', dirpath);
    var watcher;
    try {
      watcher = fs.watch(dirpath, that.options, that._handle.bind(that, dirpath));
    } catch (err) {
      debug('[error] fs.watch error: %s', err.message);
      return;
    }
    watchers[dirpath] = watcher;
    watcher.once('error', that._onWatcherError.bind(that, dirpath));
  }).on('error', function (err) {
    that.emit('watch-error-' + dir);
  }).on('end', function () {
    debug('watch %s done', dir);
    that.emit('watch-' + dir);
  });
};

proto.close = function () {
  this.removeAllListeners();
  for (var k in this._watchers) {
    this._watchers[k].close();
  }
  this._watchers = {};
};

proto._onWatcherError = function (dirpath, err) {
  var watcher = this._watchers[dirpath];
  debug('[error] watcher error: %s', err.message);
  watcher.close();
  delete this._watchers[dirpath];
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

    if (info.remove) {
      var watcher = that._watchers[info.path];
      if (watcher) {
        // close the exists watcher
        info.isDirectory = true;
        watcher.close();
        delete that._watchers[info.path];
      }
    } else if (info.isDirectory) {
      var watcher = that._watchers[info.path];
      if (!watcher) {
        // add new watcher
        that.watch(info.path);
      }
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
