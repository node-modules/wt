/**!
 * wt - test/demo.js
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
var wt = require('../');

var watcher = wt.watch(path.join(__dirname, 'fixtures'));

watcher.on('all', function (info) {
  console.log(info.event, info.remove, info.path);
});
