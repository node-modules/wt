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

  beforeEach(function(done) {
    this.watcher = wt.watch([
      path.join(fixtures, 'subdir'),
      path.join(fixtures, 'otherdir')
    ], done);
  });

  afterEach(function () {
    this.watcher.close();
  });

  it('should watch file change on subdir and otherdir', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'subfoo.txt');
    var filepath2 = path.join(fixtures, 'otherdir', 'otherfoo.txt');
    var changefiles = [];

    var done = pedding(2, function (err) {
      should.not.exist(err);
      changefiles.should.length(2);
      should.ok(changefiles.indexOf(filepath1) >= 0);
      should.ok(changefiles.indexOf(filepath2) >= 0);
      _done();
    });

    fs.writeFileSync(filepath1, 'bar');
    fs.writeFileSync(filepath2, 'bar');

    this.watcher.on('file', function (info) {
      if (changefiles.indexOf(info.path) >= 0) {
        return;
      }
      changefiles.push(info.path);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch subdir file change', function (_done) {
    var filepath1 = path.join(fixtures, 'subdir', 'sub', 'subfoo.txt');
    var filepath2 = path.join(fixtures, 'otherdir', 'sub', 'subfoo.txt');

    var changefiles = [];
    var changealls = [];

    var done = pedding(4, function (err) {
      should.not.exist(err);
      changefiles.should.length(2);
      changealls.should.length(2);
      should.ok(changefiles.indexOf(filepath1) >= 0);
      should.ok(changefiles.indexOf(filepath2) >= 0);
      should.ok(changealls.indexOf(filepath1) >= 0);
      should.ok(changealls.indexOf(filepath2) >= 0);
      _done();
    });

    fs.writeFileSync(filepath1, 'subbar');
    fs.writeFileSync(filepath2, 'subbar');

    this.watcher.on('file', function (info) {
      if (changefiles.indexOf(info.path) >= 0) {
        return;
      }
      changefiles.push(info.path);
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      if (changealls.indexOf(info.path) >= 0) {
        return;
      }
      changealls.push(info.path);
      info.isFile.should.equal(true);
      done();
    });
  });

  describe('remove file', function() {
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdel.txt');
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdel.txt');

    before(function(done) {
      done = pedding(2, done);
      fs.writeFile(filepath1, 'need to be delete', done);
      fs.writeFile(filepath2, 'need to be delete123', done);
    });

    it('should watch file remove', function (_done) {
      var removefiles = [];
      var allfiles = [];

      var done = pedding(4, function (err) {
        should.not.exist(err);
        removefiles.should.length(2);
        allfiles.should.length(2);
        should.ok(removefiles.indexOf(filepath1) >= 0);
        should.ok(removefiles.indexOf(filepath2) >= 0);
        should.ok(allfiles.indexOf(filepath1) >= 0);
        should.ok(allfiles.indexOf(filepath2) >= 0);
        _done();
      });

      fs.unlinkSync(filepath1, done);
      fs.unlinkSync(filepath2, done);

      this.watcher.on('remove', function (info) {
        if (info.path.indexOf('/sub/ubdel.txt') > 0) {
          // this a bug on node@0.11.x fs.watch
          return;
        }
        if (removefiles.indexOf(info.path) >= 0) {
          // repeat emit
          return;
        }
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
        if (allfiles.indexOf(info.path) >= 0) {
          // repeat emit
          return;
        }
        allfiles.push(info.path);
        info.event.should.equal('rename');
        info.isFile.should.equal(false);
        info.remove.should.equal(true);
        done();
      });
    });
  });

  describe('remove dir', function() {
    var dirpath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    var dirpath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');

    before(function(done) {
      done = pedding(2, done);
      fs.existsSync(dirpath1) && fs.rmdirSync(dirpath1);
      fs.existsSync(dirpath2) && fs.rmdirSync(dirpath2);
      fs.mkdir(dirpath1, done);
      fs.mkdir(dirpath2, done);
    });

    after(function (done) {
      fs.existsSync(dirpath1) && fs.rmdirSync(dirpath1);
      fs.existsSync(dirpath2) && fs.rmdirSync(dirpath2);
      setTimeout(done, 500);
    });


    it('should watch dir remove', function (_done) {
      var removedirs = [];
      var alldirs = [];

      var done = pedding(4, function (err) {
        should.not.exist(err);
        alldirs.should.length(2);
        removedirs.should.length(2);
        should.ok(alldirs.indexOf(dirpath1) >= 0);
        should.ok(alldirs.indexOf(dirpath2) >= 0);
        should.ok(removedirs.indexOf(dirpath1) >= 0);
        should.ok(removedirs.indexOf(dirpath2) >= 0);
        _done();
      });

      fs.rmdirSync(dirpath1);
      fs.rmdirSync(dirpath2);

      this.watcher.on('remove', function (info) {
        if (info.path.indexOf('/sub/ubdeldir') > 0) {
          // this a bug on node@0.11.x fs.watch
          return;
        }
        if (!info.isDirectory) {
          return;
        }
        if (removedirs.indexOf(info.path) >= 0) {
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
        if (!info.isDirectory) {
          return;
        }
        if (alldirs.indexOf(info.path) >= 0) {
          return;
        }
        alldirs.push(info.path);
        info.remove.should.equal(true);
        info.isDirectory.should.equal(true);
        done();
      });
    });
  });

  describe('create', function() {

    var filepath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');

    before(function() {
      fs.existsSync(filepath1) && fs.rmdirSync(filepath1);
      fs.existsSync(filepath2) && fs.rmdirSync(filepath2);
    });

    it('should watch dir create', function (_done) {
      var changedirs = [];
      var alldirs = [];

      var done = pedding(4, function (err) {
        should.not.exist(err);
        changedirs.should.length(2);
        alldirs.should.length(2);
        _done();
      });

      fs.mkdirSync(filepath1);
      fs.mkdirSync(filepath2);

      this.watcher.on('dir', function (info) {
        if (info.path.indexOf('/sub/ubdeldir') > 0) {
          info.remove.should.equal(true);
          // this a bug on node@0.11.x fs.watch
          return;
        }
        if (changedirs.indexOf(info.path) >= 0) {
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
        if (alldirs.indexOf(info.path) >= 0) {
          return;
        }
        alldirs.push(info.path);
        info.isFile.should.equal(false);
        info.isDirectory.should.equal(true);
        info.remove.should.equal(false);
        done();
      });
      setTimeout(done, 500);
    });
  });
});
