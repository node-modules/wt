/**!
 * wt - test/index.test.js
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
var pedding = require('pedding');
var rmdirRecursive = require('rmdir-recursive');
var wt = require('../');

describe('index.test.js', function () {
  var fixtures = path.join(__dirname, 'fixtures');

  beforeEach(function (done) {
    var watcher = wt.watch(fixtures, function () {
      watcher.isWatching(fixtures).should.equal(true);
      watcher.isWatching(path.join(fixtures, 'subdir', 'subsubdir')).should.equal(true);
      done();
    });
    this.watcher = watcher;
  });

  afterEach(function (done) {
    this.watcher.close();
    rmdirRecursive.sync(path.join(fixtures, '.createdir'));
    rmdirRecursive.sync(path.join(fixtures, 'unwatch-test-dir'));
    setTimeout(done, 100);
  });

  it('should watch file change', function (done) {
    done = pedding(2, done);
    var filepath = path.join(fixtures, 'foo.txt');
    fs.writeFile(filepath, 'bar', done);

    var lastpath = null;
    this.watcher.once('file', function (info) {
      lastpath = info.path;
      info.path.should.equal(filepath);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should ignore hidden file change', function (done) {
    done = pedding(2, done);
    var filepath = path.join(fixtures, '.file.txt.swp');
    fs.writeFile(filepath, 'vim tmp file\n', done);

    this.watcher.on('file', function () {
      throw new Error('should not run this');
    });
    setTimeout(done, 200);
  });

  it('should ignore hidden dir change', function (done) {
    done = pedding(2, done);
    var dirpath = path.join(fixtures, '.createdir');
    fs.mkdir(dirpath, done);

    this.watcher.on('dir', function () {
      throw new Error('should not run this');
    });
    setTimeout(done, 200);
  });

  it('should not ignore hidden dir change with ignoreHidden option', function (done) {
    done = pedding(2, done);

    this.watcher.close();
    this.watcher = wt.watch(fixtures, {ignoreHidden: false}, function() {
      var dirpath = path.join(fixtures, '.createdir');
      fs.mkdir(dirpath, done);

      this.watcher.on('dir', function () {
        done();
      });
    }.bind(this));
  });

  it('should watch subdir file change', function (done) {
    done = pedding(2, done);
    var filepath = path.join(fixtures, 'subdir', 'subfoo.txt');
    fs.writeFile(filepath, 'subbar', done);

    var lastpath = null;
    this.watcher.on('file', function (info) {
      if (lastpath === info.path) {
        // watch will repeat
        return;
      }
      lastpath = info.path;
      info.path.should.equal(filepath);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch file remove', function (done) {
    done = pedding(2, done);
    var filepath = path.join(fixtures, 'subdir', 'subsubdir', 'subsubdel.txt');
    fs.writeFileSync(filepath, 'need to be delete');

    fs.unlink(filepath, done);

    var lastpath = null;
    this.watcher.on('remove', function (info) {
      if (filepath !== info.path) {
        return;
      }
      if (lastpath === info.path) {
        // watch will repeat
        return;
      }
      lastpath = info.path;
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir remove', function (done) {
    done = pedding(3, done);
    var filepath = path.join(fixtures, 'subdir', 'subsubdir', 'subsubdeldir');
    !fs.existsSync(filepath) && fs.mkdirSync(filepath);

    fs.rmdir(filepath, done);

    var lastpath = null;
    var allpath = null;
    this.watcher.on('remove', function (info) {
      if (info.path !== filepath) {
        return;
      }

      if (lastpath === info.path) {
        // watch will repeat
        return;
      }
      lastpath = info.path;
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    }).on('all', function (info) {
      if (info.path !== filepath) {
        // watch will repeat and cause other change on linux
        return;
      }

      if (allpath === info.path) {
        // watch will repeat
        return;
      }
      allpath = info.path;
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir create', function (done) {
    done = pedding(2, done);
    var filepath = path.join(fixtures, 'subdir', 'subsubdir', 'subsubdeldir');
    fs.existsSync(filepath) && fs.rmdirSync(filepath);
    fs.mkdir(filepath, done);

    var lastpath = null;
    this.watcher.on('dir', function (info) {
      if (filepath !== info.path) {
        return;
      }

      if (lastpath === info.path) {
        return;
      }
      lastpath = info.path;
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    });
  });

  it('should emit watch event twice', function(done) {
    done = pedding(2, done);

    this.watcher.close();
    this.watcher = wt.watch([
      path.join(fixtures, 'subdir'),
      path.join(fixtures, 'subdir2')
    ]).on('watch', done.bind(null, null));
  });

  it('should emit error event', function(done) {
    var filepath = path.join(fixtures, 'not-exist');
    var watcher = wt.watch(filepath);
    watcher.on('error', function(err) {
      err.message.should.containEql('ENOENT');
      err.dir.should.eql(filepath);
      watcher.close();
      done();
    });
  });

  it('should emit unwatch event when root dir remove', function (done) {
    var dirpath = path.join(fixtures, 'unwatch-test-dir');
    this.watcher.once('dir', function (info) {
      info.path.should.equal(dirpath);
      info.event.should.equal('rename');
      info.isDirectory.should.equal(true);
      setTimeout(function () {
        rmdirRecursive.sync(dirpath);
      }, 100);
    });

    this.watcher.once('unwatch', function (dir) {
      dir.should.containEql(dirpath);
      setTimeout(done, 100);
    });
    fs.mkdirSync(dirpath);
    fs.mkdirSync(path.join(dirpath, 'subdir1'));
    fs.mkdirSync(path.join(dirpath, 'subdir2'));
    fs.mkdirSync(path.join(dirpath, 'subdir3'));
    setTimeout(function () {
      fs.writeFileSync(path.join(dirpath, 'subdir3', 'f3.txt'), 'f3');
    }, 50);
  });

  it('should mock watcher error event emit', function (done) {
    this.watcher.once('error', function (err) {
      err.message.should.equal('mock error');
      err.dir.should.equal(fixtures);
      done();
    });
    this.watcher._watchers[fixtures].emit('error', new Error('mock error'));
  });

  describe('options.rewatchInterval = 500', function () {
    var watcher;
    var rootDir = path.join(__dirname, 'rewatchInterval_tmp');
    rmdirRecursive.sync(rootDir);
    fs.mkdirSync(rootDir);
    beforeEach(function (done) {
      watcher = new wt.Watcher({
        rewatchInterval: 500
      });
      watcher.once('watch', function (dir) {
        dir.should.equal(rootDir);
        done();
      });
      watcher.watch(rootDir);
    });

    afterEach(function (done) {
      watcher.close();
      rmdirRecursive.sync(rootDir);
      setTimeout(done, 500);
    });

    it('should auto rewatch root dir', function (done) {
      watcher.once('unwatch', function (dir) {
        dir.should.equal(rootDir);
        // create dir again
        watcher.once('watch', function (dir) {
          dir.should.equal(rootDir);
          done();
        });
        setTimeout(function () {
          fs.mkdirSync(rootDir);
        }, 1100);
      });
      rmdirRecursive.sync(rootDir);
    });

    it('should rewatch check pass', function (done) {
      watcher.watch(fixtures);
      watcher.watch(fixtures + 'not-exists');
      // mock watch file
      fs.writeFileSync(fixtures + 'not-exists');
      setTimeout(function () {
        fs.unlink(fixtures + 'not-exists', done);
      }, 1000);
    });
  });

  describe('unwatch()', function () {
    var watcher;
    var rootDir = path.join(__dirname, 'unwatch_tmp');
    rmdirRecursive.sync(rootDir);
    fs.mkdirSync(rootDir);
    beforeEach(function (done) {
      watcher = new wt.Watcher({
        rewatchInterval: 500
      });
      watcher.once('watch', function (dir) {
        dir.should.equal(rootDir);
        done();
      });
      watcher.watch(rootDir);
      // watch exists root dir
      watcher.watch([rootDir]);
    });

    afterEach(function (done) {
      watcher.close();
      rmdirRecursive.sync(rootDir);
      setTimeout(done, 500);
    });

    it('should unwatch rootdir', function (done) {
      watcher.once('unwatch', function (dir) {
        dir.should.equal(rootDir);
        // wont rewatch after dir is unwatch
        watcher.once('watch', function () {
          throw new Error('should not run this');
        });
        setTimeout(function () {
          watcher.unwatch(rootDir);
          // again should work
          watcher.unwatch([rootDir]);
          fs.mkdirSync(rootDir);
          setTimeout(done, 500);
        }, 500);
      });
      rmdirRecursive.sync(rootDir);
    });
  });
});
