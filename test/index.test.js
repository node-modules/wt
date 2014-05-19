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

var should = require('should');
var path = require('path');
var fs = require('fs');
var pedding = require('pedding');
var wt = require('../');

describe('index.test.js', function () {
  var fixtures = path.join(__dirname, 'fixtures');

  beforeEach(function () {
    this.watcher = wt.watch(fixtures);
  });

  afterEach(function () {
    this.watcher.close();
  });

  it('should watch file change', function (done) {
    done = pedding(3, done);
    var filepath = path.join(fixtures, 'foo.txt');

    fs.writeFile(filepath, 'bar', done);

    this.watcher.on('file', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch subdir file change', function (done) {
    done = pedding(3, done);
    var filepath = path.join(fixtures, 'subdir', 'subfoo.txt');

    fs.writeFile(filepath, 'subbar', done);

    this.watcher.on('file', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch file remove', function (done) {
    done = pedding(3, done);
    var filepath = path.join(fixtures, 'subdir', 'subsubdir', 'subsubdel.txt');
    fs.writeFileSync(filepath, 'need to be delete');

    fs.unlink(filepath, done);

    this.watcher.on('remove', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    }).on('all', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir create', function (done) {
    done = pedding(3, done);
    var filepath = path.join(fixtures, 'subdir', 'subsubdir', 'subsubdeldir');
    !fs.existsSync(filepath) && fs.mkdirSync(filepath);

    fs.rmdir(filepath, done);

    this.watcher.on('remove', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    }).on('all', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir remove', function (done) {
    done = pedding(3, done);
    var filepath = path.join(fixtures, 'subdir', 'subsubdir', 'subsubdeldir');
    fs.existsSync(filepath) && fs.rmdirSync(filepath);

    fs.mkdir(filepath, done);

    this.watcher.on('dir', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    }).on('all', function (info) {
      info.path.should.equal(filepath);
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    });
  });
});
