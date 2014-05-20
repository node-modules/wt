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

  beforeEach(function () {
    this.watcher = wt.watch([
      path.join(fixtures, 'subdir'),
      path.join(fixtures, 'otherdir')
    ]);
  });

  afterEach(function () {
    this.watcher.close();
  });

  it('should watch file change on subdir and otherdir', function (done) {
    done = pedding(6, done);
    var filepath1 = path.join(fixtures, 'subdir', 'subfoo.txt');
    fs.writeFile(filepath1, 'bar', done);
    var filepath2 = path.join(fixtures, 'otherdir', 'otherfoo.txt');
    fs.writeFile(filepath2, 'bar', done);

    var indexfile = 0;
    var indexall = 0;
    this.watcher.on('file', function (info) {
      if (indexfile++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      if (indexall++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }

      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch file change on subdir and subdir2', function (_done) {
    var watcher = wt.watch([
      path.join(fixtures, 'subdir'),
      path.join(fixtures, 'subdir2')
    ]);

    // fs.watch have a bug on same prefix dir
    var done = pedding(6, function (err) {
      should.not.exist(err);
      watcher.close();
      _done();
    });
    var filepath1 = path.join(fixtures, 'subdir', 'subfoo.txt');
    fs.writeFile(filepath1, 'bar', done);
    var filepath2 = path.join(fixtures, 'subdir2', 'subfoo2.txt');
    fs.writeFile(filepath2, 'bar', done);

    var indexfile = 0;
    var indexall = 0;
    watcher.on('file', function (info) {
      if (indexfile++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      if (indexall++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }

      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch subdir file change', function (done) {
    done = pedding(6, done);
    var filepath1 = path.join(fixtures, 'subdir', 'sub', 'subfoo.txt');
    fs.writeFile(filepath1, 'subbar', done);
    var filepath2 = path.join(fixtures, 'otherdir', 'sub', 'subfoo.txt');
    fs.writeFile(filepath2, 'subbar', done);

    var indexfile = 0;
    var indexall = 0;
    this.watcher.on('file', function (info) {
      if (indexfile++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.isFile.should.equal(true);
      done();
    }).on('all', function (info) {
      if (indexall++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }

      info.isFile.should.equal(true);
      done();
    });
  });

  it('should watch file remove', function (done) {
    done = pedding(6, done);
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdel.txt');
    fs.writeFileSync(filepath1, 'need to be delete');
    fs.unlink(filepath1, done);

    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdel.txt');
    fs.writeFileSync(filepath2, 'need to be delete');
    fs.unlink(filepath2, done);

    var indexfile = 0;
    var indexall = 0;
    this.watcher.on('remove', function (info) {
      if (indexfile++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    }).on('all', function (info) {
      if (indexall++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }

      info.isFile.should.equal(false);
      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir remove', function (done) {
    done = pedding(6, done);
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    !fs.existsSync(filepath1) && fs.mkdirSync(filepath1);
    fs.rmdir(filepath1, done);
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');
    !fs.existsSync(filepath2) && fs.mkdirSync(filepath2);
    fs.rmdir(filepath2, done);

    var indexfile = 0;
    var indexall = 0;
    this.watcher.on('remove', function (info) {
      if (indexfile++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.remove.should.equal(true);
      done();
    }).on('all', function (info) {
      if (indexall++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }

      info.remove.should.equal(true);
      done();
    });
  });

  it('should watch dir create', function (done) {
    done = pedding(6, done);
    var filepath1 = path.join(fixtures, 'subdir', 'subsubdeldir');
    fs.existsSync(filepath1) && fs.rmdirSync(filepath1);
    fs.mkdir(filepath1, done);
    var filepath2 = path.join(fixtures, 'otherdir', 'subsubdeldir');
    fs.existsSync(filepath2) && fs.rmdirSync(filepath2);
    fs.mkdir(filepath2, done);

    var indexfile = 0;
    var indexall = 0;
    this.watcher.on('dir', function (info) {
      if (indexfile++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    }).on('all', function (info) {
      if (indexall++ === 0) {
        info.path.should.equal(filepath1);
      } else {
        info.path.should.equal(filepath2);
      }
      info.isFile.should.equal(false);
      info.isDirectory.should.equal(true);
      info.remove.should.equal(false);
      done();
    });
  });
});
