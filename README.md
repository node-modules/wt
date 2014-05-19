wt
=======

[![Build Status](https://secure.travis-ci.org/node-modules/wt.png)](http://travis-ci.org/node-modules/wt)
[![Dependency Status](https://gemnasium.com/node-modules/wt.png)](https://gemnasium.com/node-modules/wt)

[![NPM](https://nodei.co/npm/wt.png?downloads=true&stars=true)](https://nodei.co/npm/wt/)

![logo](https://raw.github.com/node-modules/wt/master/logo.png)

wt: Simple dir watcher, support events:

* `all`: every change event
* `file`: file change event, not include file remove
* `dir`: dir change event, not include dir remove

## Install

```bash
$ npm install wt
```

## Usage

```js
var wt = require('wt');

var watcher = wt.watch(__dirname);
watcher.on('all', function (info) {

}).on('file', function (info) {

}).on('dir', function (info) {

});

setTimeout(function () {
  watcher.close();
}, 10000);
```

## License

(The MIT License)

Copyright (c) 2014 fengmk2 &lt;fengmk2@gmail.com&gt; and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
