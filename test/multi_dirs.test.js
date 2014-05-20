/**!
 * wt - test/multi_dirs.test.js
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

var should = require('should');
var path = require('path');
var fs = require('fs');
var pedding = require('pedding');
var wt = require('../');

describe('multi_dirs.test.js', function () {
  var fixtures = path.join(__dirname, 'fixtures');

  beforeEach(function (done) {
    this.watcher = wt.watch([
      path.join(fixtures, 'subdir'),
      path.join(fixtures, 'otherdir')
    ], done);
  });

  afterEach(function () {
    this.watcher.close();
  });

  after(function (done) {
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');
    fs.existsSync(filepath1) && fs.rmdirSync(filepath1);
    fs.existsSync(filepath2) && fs.rmdirSync(filepath2);

    setTimeout(done, 500);
  });

  it('should watch file change on subdir and otherdir', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'subfoo.txt');
    var filepath2 = path.join(fixtures, 'otherdir', 'otherfoo.txt');
    var changefiles = [];
    var changealls = [];

    var done = pedding(6, function (err) {
      should.not.exist(err);
      changefiles.should.length(2);
      changealls.should.length(2);
      should.ok(changefiles.indexOf(filepath1) >= 0);
      should.ok(changefiles.indexOf(filepath2) >= 0);
      should.ok(changealls.indexOf(filepath1) >= 0);
      should.ok(changealls.indexOf(filepath2) >= 0);
      _done();
    });

    fs.writeFile(filepath1, 'bar', done);
    fs.writeFile(filepath2, 'bar', done);

    this.watcher.on('file', function (info) {
      changefiles.push(info.path);
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      changealls.push(info.path);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch subdir file change', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'sub', 'subfoo.txt');
    var filepath2 = path.join(fixtures, 'otherdir', 'sub', 'subfoo.txt');

    var changefiles = [];
    var changealls = [];

    var done = pedding(6, function (err) {
      should.not.exist(err);
      changefiles.should.length(2);
      changealls.should.length(2);
      should.ok(changefiles.indexOf(filepath1) >= 0);
      should.ok(changefiles.indexOf(filepath2) >= 0);
      should.ok(changealls.indexOf(filepath1) >= 0);
      should.ok(changealls.indexOf(filepath2) >= 0);
      _done();
    });

    fs.writeFile(filepath1, 'subbar', done);
    fs.writeFile(filepath2, 'subbar', done);

    this.watcher.on('file', function (info) {
      changefiles.push(info.path);
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      changealls.push(info.path);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch file remove', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdel.txt');
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdel.txt');
    fs.writeFileSync(filepath1, 'need to be delete');
    fs.writeFileSync(filepath2, 'need to be delete123');

    var removefiles = [];
    var allfiles = [];
    var done = pedding(6, function (err) {
      should.not.exist(err);
      removefiles.should.length(2);
      allfiles.should.length(2);
      should.ok(removefiles.indexOf(filepath1) >= 0);
      should.ok(removefiles.indexOf(filepath2) >= 0);
      should.ok(allfiles.indexOf(filepath1) >= 0);
      should.ok(allfiles.indexOf(filepath2) >= 0);
      _done();
    });

    fs.unlink(filepath1, done);
    fs.unlink(filepath2, done);


    var lastallpath = null;
    var lastfilepath = null;
    this.watcher.on('remove', function (info) {
      if (info.path.indexOf('/sub/ubdel.txt') > 0) {
        // this a bug on node@0.11.x fs.watch
        return;
      }
      if (lastfilepath === info.path) {
        // repeat emit
        return;
      }
      lastfilepath = info.path;
      removefiles.push(info.path);

      info.event.should.equal('rename');
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    }).on('all', function (info) {
      if (info.path.indexOf('/sub/ubdel.txt') > 0) {
        // this a bug on node@0.11.x fs.watch
        return;
      }
      if (lastallpath === info.path) {
        // repeat emit
        return;
      }
      lastallpath = info.path;
      allfiles.push(info.path);
      info.event.should.equal('rename');
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir remove', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');
    fs.existsSync(filepath1) && fs.rmdirSync(filepath1);
    fs.existsSync(filepath2) && fs.rmdirSync(filepath2);

    fs.mkdirSync(filepath1);
    fs.mkdirSync(filepath2);

    var watcher = this.watcher;

    function run() {
      var removedirs = [];
      var alldirs = [];

      var done = pedding(6, function (err) {
        should.not.exist(err);
        alldirs.should.length(2);
        removedirs.should.length(2);
        should.ok(alldirs.indexOf(filepath1) >= 0);
        should.ok(alldirs.indexOf(filepath2) >= 0);
        should.ok(removedirs.indexOf(filepath1) >= 0);
        should.ok(removedirs.indexOf(filepath2) >= 0);
        _done();
      });

      fs.rmdir(filepath1, done);
      fs.rmdir(filepath2, done);

      watcher.on('remove', function (info) {
        if (info.path.indexOf('/sub/ubdeldir') > 0) {
          // this a bug on node@0.11.x fs.watch
          return;
        }

        removedirs.push(info.path);
        info.remove.should.equal(true);
        info.isDirectory.should.equal(true);
        done();
      }).on('all', function (info) {
        if (info.path.indexOf('/sub/ubdeldir') > 0) {
          // this a bug on node@0.11.x fs.watch
          return;
        }

        alldirs.push(info.path);
        info.remove.should.equal(true);
        info.isDirectory.should.equal(true);
        done();
      });
    }

    var count = 0;
    watcher.once('watch-' + filepath2, function () {
      if (++count === 2) {
        run();
      }
    });
    watcher.once('watch-' + filepath1, function () {
      if (++count === 2) {
        run();
      }
    });
  });

  it('should watch dir create', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');
    fs.existsSync(filepath1) && fs.rmdirSync(filepath1);
    fs.existsSync(filepath2) && fs.rmdirSync(filepath2);

    var changedirs = [];
    var alldirs = [];

    var done = pedding(6, function (err) {
      should.not.exist(err);
      changedirs.should.length(2);
      alldirs.should.length(2);
      _done();
    });

    fs.mkdir(filepath1, done);
    fs.mkdir(filepath2, done);

    var indexfile = 0;
    var indexall = 0;
    this.watcher.on('dir', function (info) {
      if (info.path.indexOf('/sub/ubdeldir') > 0) {
        info.remove.should.equal(true);
        // this a bug on node@0.11.x fs.watch
        return;
      }

      changedirs.push(info.path);
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    }).on('all', function (info) {
      if (info.path.indexOf('/sub/ubdeldir') > 0) {
        // this a bug on node@0.11.x fs.watch
        return;
      }

      alldirs.push(info.path);
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    });
  });
});
