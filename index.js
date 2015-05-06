/**!
 * wt - index.js
 *
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
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
 * @param {Object} options
 *  - {Boolean} [ignoreHidden] ignore hidden file or not, default is `true`
 * @param {Function} [done], watch all dirs done callback.
 */
function Watcher(options) {
  // http://nodejs.org/dist/v0.11.12/docs/api/fs.html#fs_caveats
  // The recursive option is currently supported on OS X.
  // Only FSEvents supports this type of file watching
  // so it is unlikely any additional platforms will be added soon.

  options = options || {};
  if (options.ignoreHidden === undefined || options.ignoreHidden === null) {
    options.ignoreHidden = true;
  }
  this._ignoreHidden = !!options.ignoreHidden;

  this.watchOptions = {
    persistent: true,
    recursive: false, // so we dont use this features
  };

  this._watchers = {};
}

Watcher.watch = function (dirs, options, done) {
  // watch(dirs, done);
  if (typeof options === 'function') {
    done = options;
    options = null;
  }

  // watch(dirs);
  if (!done) {
    done = function() {};
  }

  var count = Array.isArray(dirs) ? dirs.length : 1;
  return new Watcher(options)
    .watch(dirs)
    .once('error', done)
    .on('watch', function () {
      count--;
      if (count === 0) {
        done();
      }
    });
};

util.inherits(Watcher, EventEmitter);

var proto = Watcher.prototype;

proto.watch = function (dir) {
  if (Array.isArray(dir)) {
    dir.forEach(this.watch.bind(this));
    return this;
  }

  var watchers = this._watchers;
  var that = this;
  debug('walking %s...', dir);
  ndir.walk(dir).on('dir', function (dirpath) {
    if (path.basename(dirpath)[0] === '.' && that._ignoreHidden) {
      debug('fs.watch ignore hidden dir: %s', dirpath);
      return;
    }
    if (watchers[dirpath]) {
      debug('fs.watch %s exists', dirpath);
      return;
    }
    debug('fs.watch %s start...', dirpath);
    var watcher;
    try {
      watcher = fs.watch(dirpath, that.watchOptions, that._handle.bind(that, dirpath));
    } catch (err) {
      debug('[error] fs.watch error: %s', err.message);
      return;
    }
    watchers[dirpath] = watcher;
    watcher.once('error', that._onWatcherError.bind(that, dirpath));
  }).on('error', function (err) {
    err.dir = dir;
    that.emit('watch-error', err);
  }).on('end', function () {
    debug('watch %s done', dir);
    debug('now watching %s', Object.keys(that._watchers));
    that.emit('watch', dir);
  });
  return this;
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
  if (name[0] === '.' && this._ignoreHidden) {
    debug('ignore %s on %s/%s', event, root, name);
    return;
  }

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
