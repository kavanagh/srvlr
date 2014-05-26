# servelr

Tiny HTTP server for front-end developers.

**Features:**

* file watching
* live reload
* opens a browser on startup.

## Installation

```sh
$ npm install -g servelr
```

## Usage

`[directory]` is optional. Defaults is the current working directory.

```sh
$ servelr --help

  Usage: servelr [options] [directory]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -p, --port <PORT>        Listen on PORT.
                              An available port will be chosen if not specified.
    -w, --watch              Files to watch if livereload is on. 
                              Use this when you don't want to watch the whole root directory.
    -l, --log <TYPE>         Turn on logging. Types are: tiny, verbose
    -a, --age <SECONDS>      Max age in seconds.
    -c, --cors               Enable CORS headers.
    -i, --interval <MS>      Watch polling interval in milliseconds. Default 500.
    -R, --no-reload          No Livereload
    -O, --no-open            Dont open browser after starting the server
    -N, --no-cache           Turn off all caching
    -L, --no-listing         Turn off directory listings
    -I, --index <FILES>      Default index page, optional.
                              Space separated list eg default.html index.html.
    -A, --address <ADDRESS>  Address to use [0.0.0.0]
    -H, --hidden             Allow hidden files
    -C, --compression        Turn on gzipping

```
