#!/usr/bin/env node

'use strict';

var path = require('path');
var http = require('http');
var express = require('express');
var portfinder = require('portfinder');
var opener = require('opener');
var program = require('commander');
var serveStatic = require('serve-static');
var pkg = require('./package.json');
var defaults = require('./defaults.json');

// parse option as a list
function li(delimiter) {
  delimiter = delimiter || ' ';
  return function (value) {
    return !value ? [] : value.split(delimiter);
  };
}

// parse option as seconds
function seconds(deflt) {
  deflt = deflt || 0;
  return function (value) {
    var i = parseInt(value, 10);
    if (isNaN(i)) return d;
    return i;
  }
}

// middleware to add CORS headers
function cors() {
  return function (req, res, next) {
    res.set({
      'Access-Control-Allow-Origin': '*'
    });
    next();
  };
}

// middleware to prevent caching - via headers
function nocache() {
  return function (req, res, next) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0'
    });
    next();
  }
}

// simple file watching.
// TODO: support globbing and multiple watch dirs
function watch(path, callback) {
  var o = {
    ignoreDotFiles: !program.hidden,
    persistent: true,
    interval: watchInterval
  };
  require('watch')
    .watchTree(path, o, function (f, curr, prev) {
      if (typeof f == "object" && prev === null && curr === null) {
      } else if (prev === null) {
      } else if (curr !== null && curr.nlink === 0) {
      } else {
        callback();
      }
    });
  return true;
}

function noop() {}

program
  .version(pkg.version)
  .usage('[options] [directory]')
  .option('-p, --port <PORT>', 'Listen on PORT. An available port will be chosen if not specified.')
  .option('-w, --watch', 'When you don\'t want to watch the root directory.')
  .option('-l, --log <TYPE>', 'Turn on log messages. Types are: tiny, verbose')
  .option('-a, --age <SECONDS>', 'Max age in seconds.', seconds(defaults.maxAge))
  .option('-c, --cors', 'Enable CORS headers.')
  .option('-i, --interval <MS>', 
                    'Watch polling interval in milliseconds. Default 500.', seconds(defaults.watchInterval))
  .option('-R, --no-reload', 'No Livereload')
  .option('-O, --no-open', 'Dont open browser after starting the server')
  .option('-N, --no-cache', 'Turn off all caching')
  .option('-L, --no-listing', 'Turn off directory listings')
  .option('-I, --index <FILES>', 
                    'Optional default index page. Space separated list eg default.html index.html.', li())
  .option('-A, --address <ADDRESS>', 'Address to use [' + defaults.address + ']', defaults.address)
  .option('-H, --hidden', 'Allow hidden files')
  .option('-C, --compression', 'Turn on gzipping')
  .parse(process.argv);

var app = express();
var server = http.createServer(app);
var log = !program.log ? noop : console.log;
var verbose = program.log === 'verbose' ? console.log : noop;
var maxAge = !program.cache ? 0 : (program.age || defaults.maxAge) * 1000;
var indexPages = program.index && program.index.length ? program.index : defaults.indexPages;
var watchInterval = program.interval || defaults.watchInterval;
var cwd = process.cwd();
var directory = !!program.args.length ? path.resolve(cwd, program.args[0]) : cwd;
var watchDirectory = program.watch ? path.resolve(cwd, program.watch) : directory;
var listingOptions = { hidden: program.hidden, icons: true, view: 'details' };

verbose('Using directory: %s', directory);

app.enable('trust proxy');
app.disable('x-powered-by');

program.log && app.use(require('morgan')(program.log === 'verbose' ? 'default' : 'dev'));
program.compression && app.use(require('compression'));
program.cors && app.use(cors());
!program.cache && app.use(nocache());

if (program.reload) {

  // inject the livereload script into html pages
  app.use(require('connect-inject')({
    snippet: [
      '<script src="/socket.io/socket.io.js"></script>',
      '<script>io.connect(window.location.origin).on(\'reload\', function (data) { window.location.reload(); });</script>'
    ]
  }));

  verbose('Starting live reload server');

  var io = require('socket.io').listen(server, { log: false });

  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set('log level', 1);

  var w = false;

  // when the browser opens/reloads first time, setup file watching.
  io.sockets.on('connection', function () {
    if (w) return;
    verbose('creating change watcher');
    w = watch(watchDirectory, function () {
      io.sockets.emit('reload');
    }); 
  });
}

// basic static file server
app.use(serveStatic(directory, {
  index: indexPages,
  maxAge: maxAge,
  hidden: program.hidden
}));

// directory listings
program.listing && app.use(require('serve-index')(directory, listingOptions));

// very basic error handling.
// TODO: is more needed here?
app.use(function (err, req, res, next) {
  console.error(err);
});

function listen(p) {
  server.listen(p);
  log('Listening on port %s', p);
  var url = 'http://' + program.address + ':' + p.toString();
  if (program.open) {
    verbose('Opening browser...');
    !program.log && console.log(pkg.name + ' running at %s', url);
    opener(url);
  }
}

if (!program.port) {
  portfinder.basePort = defaults.basePort;
  portfinder.getPort(function (err, port) {
      if (err) throw err;
      listen(port);
  });
} else {
  listen(program.port);
}
