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
var wt = require('../');

describe('index.test.js', function () {
  var fixtures = path.join(__dirname, 'fixtures');

  beforeEach(function (done) {
    this.watcher = wt.watch(fixtures, done);
  });

  afterEach(function (done) {
    try {
      fs.rmdirSync(path.join(fixtures, '.createdir'));
    } catch (err) {}
    this.watcher.close();
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

  it('should emit watch-error event', function(done) {
    var filepath = path.join(fixtures, 'not-exist');

    this.watcher.close();
    this.watcher = wt.watch(filepath)
    .on('watch-error', function(err) {
      err.dir.should.eql(filepath);
      done();
    });
  });
});
