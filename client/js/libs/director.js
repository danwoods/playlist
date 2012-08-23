(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    
    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();
});

require.define("vm",function(require,module,exports,__dirname,__filename,process){module.exports = require("vm-browserify")});

require.define("/node_modules/vm-browserify/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"index.js"}});

require.define("/node_modules/vm-browserify/index.js",function(require,module,exports,__dirname,__filename,process){var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInNewContext = function (context) {
    if (!context) context = {};
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
     
    if (!win.eval && win.execScript) {
        // win.eval() magically appears when this is called in IE:
        win.execScript('null');
    }
    
    var res = win.eval(this.code);
    
    forEach(Object_keys(win), function (key) {
        context[key] = win[key];
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInContext = function (context) {
    // seems to be just runInNewContext on magical context objects which are
    // otherwise indistinguishable from objects except plain old objects
    // for the parameter segfaults node
    return this.runInNewContext(context);
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    // not really sure what this one does
    // seems to just make a shallow copy
    var copy = {};
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};
});

require.define("/director/router.js",function(require,module,exports,__dirname,__filename,process){/*
 * router.js: Base functionality for the router.
 *
 * (C) 2011, Nodejitsu Inc.
 * MIT LICENSE
 *
 */

//
// Helper function to turn flatten an array.
//
function _flatten (arr) {
  var flat = [];

  for (var i = 0, n = arr.length; i < n; i++) {
    flat = flat.concat(arr[i]);
  }

  return flat;
}

//
// Helper function for wrapping Array.every
// in the browser.
//
function _every (arr, iterator) {
  for (var i = 0; i < arr.length; i += 1) {
    if (iterator(arr[i], i, arr) === false) {
      return;
    }
  }
}

//
// Helper function for performing an asynchronous every
// in series in the browser and the server.
//
function _asyncEverySeries (arr, iterator, callback) {
  if (!arr.length) {
    return callback();
  }

  var completed = 0;
  (function iterate() {
    iterator(arr[completed], function (err) {
      if (err || err === false) {
        callback(err);
        callback = function () {};
      }
      else {
        completed += 1;
        if (completed === arr.length) {
          callback();
        }
        else {
          iterate();
        }
      }
    });
  })();
}

//
// Helper function for expanding "named" matches
// (e.g. `:dog`, etc.) against the given set
// of params:
//
//    {
//      ':dog': function (str) {
//        return str.replace(/:dog/, 'TARGET');
//      }
//      ...
//    }
//
function paramifyString(str, params, mod) {
  mod = str;
  for (var param in params) {
    if (params.hasOwnProperty(param)) {
      mod = params[param](str);
      if (mod !== str) { break; }
    }
  }

  return mod === str
    ? '([._a-zA-Z0-9-]+)'
    : mod;
}

//
// Helper function for expanding wildcards (*) and
// "named" matches (:whatever)
//
function regifyString(str, params) {
  if (~str.indexOf('*')) {
    str = str.replace(/\*/g, '([_\.\(\)!\\ %@&a-zA-Z0-9-]+)');
  }

  var captures = str.match(/:([^\/]+)/ig),
      length;

  if (captures) {
    length = captures.length;
    for (var i = 0; i < length; i++) {
      str = str.replace(captures[i], paramifyString(captures[i], params));
    }
  }

  return str;
}

//
// ### function Router (routes)
// #### @routes {Object} **Optional** Routing table for this instance.
// Constuctor function for the Router object responsible for building
// and dispatching from a given routing table.
//
var Router = exports.Router = function (routes) {
  this.params   = {};
  this.routes   = {};
  this.methods  = ['on', 'after', 'before'];
  this.scope    = [];
  this._methods = {};

  this.configure();
  this.mount(routes || {});
};

//
// ### function configure (options)
// #### @options {Object} **Optional** Options to configure this instance with
// Configures this instance with the specified `options`.
//
Router.prototype.configure = function (options) {
  options = options || {};

  for (var i = 0; i < this.methods.length; i++) {
    this._methods[this.methods[i]] = true;
  }

  this.recurse   = options.recurse   || this.recurse || false;
  this.async     = options.async     || false;
  this.delimiter = options.delimiter || '\/';
  this.strict    = typeof options.strict === 'undefined' ? true : options.strict;
  this.notfound  = options.notfound;
  this.resource  = options.resource;

  // Client only, but browser.js does not include a super implementation
  this.history     = (options.html5history && this.historySupport) || false;
  this.run_in_init = (this.history === true && options.run_handler_in_init !== false);

  //
  // TODO: Global once
  //
  this.every = {
    after: options.after || null,
    before: options.before || null,
    on: options.on || null
  };

  return this;
};

//
// ### function param (token, regex)
// #### @token {string} Token which to replace (e.g. `:dog`, 'cat')
// #### @matcher {string|RegExp} Target to replace the token with.
// Setups up a `params` function which replaces any instance of `token`,
// inside of a given `str` with `matcher`. This is very useful if you
// have a common regular expression throughout your code base which
// you wish to be more DRY.
//
Router.prototype.param = function (token, matcher) {
  if (token[0] !== ':') {
    token = ':' + token;
  }

  var compiled = new RegExp(token, 'g');
  this.params[token] = function (str) {
    return str.replace(compiled, matcher.source || matcher);
  };
};

//
// ### function on (method, path, route)
// #### @method {string} **Optional** Method to use
// #### @path {Array|string} Path to set this route on.
// #### @route {Array|function} Handler for the specified method and path.
// Adds a new `route` to this instance for the specified `method`
// and `path`.
//
Router.prototype.on = Router.prototype.route = function (method, path, route) {
  var self = this;

  if (!route && typeof path == 'function') {
    //
    // If only two arguments are supplied then assume this
    // `route` was meant to be a generic `on`.
    //
    route = path;
    path = method;
    method = 'on';
  }

  if (Array.isArray(path)) {
    return path.forEach(function(p) {
      self.on(method, p, route);
    });
  }

  if (path.source) {
    path = path.source.replace(/\\\//ig, '/');
  }

  if (Array.isArray(method)) {
    return method.forEach(function (m) {
      self.on(m.toLowerCase(), path, route);
    });
  }

  this.insert(method, this.scope.concat(path.split(new RegExp(this.delimiter))), route);
};

//
// ### function path (path, routesFn)
// #### @path {string|RegExp} Nested scope in which to path
// #### @routesFn {function} Function to evaluate in the new scope
// Evalutes the `routesFn` in the given path scope.
//
Router.prototype.path = function (path, routesFn) {
  var self = this,
      length = this.scope.length;

  if (path.source) {
    path = path.source.replace(/\\\//ig, '/');
  }

  path = path.split(new RegExp(this.delimiter));
  this.scope = this.scope.concat(path);

  routesFn.call(this, this);
  this.scope.splice(length, path.length);
};

//
// ### function dispatch (method, path[, callback])
// #### @method {string} Method to dispatch
// #### @path {string} Path to dispatch
// #### @callback {function} **Optional** Continuation to respond to for async scenarios.
// Finds a set of functions on the traversal towards
// `method` and `path` in the core routing table then
// invokes them based on settings in this instance.
//
Router.prototype.dispatch = function (method, path, callback) {
  var self = this,
      fns = this.traverse(method, path, this.routes, ''),
      invoked = this._invoked,
      after;

  this._invoked = true;
  if (!fns || fns.length === 0) {
    this.last = [];
    if (typeof this.notfound === 'function') {
      this.invoke([this.notfound], { method: method, path: path }, callback);
    }

    return false;
  }

  if (this.recurse === 'forward') {
    fns = fns.reverse();
  }

  function updateAndInvoke() {
    self.last = fns.after;
    self.invoke(self.runlist(fns), self, callback);
  }

  //
  // Builds the list of functions to invoke from this call
  // to dispatch conforming to the following order:
  //
  // 1. Global after (if any)
  // 2. After functions from the last call to dispatch
  // 3. Global before (if any)
  // 4. Global on (if any)
  // 5. Matched functions from routing table (`['before', 'on'], ['before', 'on`], ...]`)
  //
  after = this.every && this.every.after
    ? [this.every.after].concat(this.last)
    : [this.last];

  if (after && after.length > 0 && invoked) {
    if (this.async) {
      this.invoke(after, this, updateAndInvoke);
    }
    else {
      this.invoke(after, this);
      updateAndInvoke();
    }

    return true;
  }

  updateAndInvoke();
  return true;
};

//
// ### function runlist (fns)
// #### @fns {Array} List of functions to include in the runlist
// Builds the list of functions to invoke from this call
// to dispatch conforming to the following order:
//
// 1. Global before (if any)
// 2. Global on (if any)
// 3. Matched functions from routing table (`['before', 'on'], ['before', 'on`], ...]`)
//
Router.prototype.runlist = function (fns) {
  var runlist = this.every && this.every.before
    ? [this.every.before].concat(_flatten(fns))
    : _flatten(fns);

  if (this.every && this.every.on) {
    runlist.push(this.every.on);
  }

  runlist.captures = fns.captures;
  runlist.source = fns.source;
  return runlist;
};

//
// ### function invoke (fns, thisArg)
// #### @fns {Array} Set of functions to invoke in order.
// #### @thisArg {Object} `thisArg` for each function.
// #### @callback {function} **Optional** Continuation to pass control to for async `fns`.
// Invokes the `fns` synchronously or asynchronously depending on the
// value of `this.async`. Each function must **not** return (or respond)
// with false, or evaluation will short circuit.
//
Router.prototype.invoke = function (fns, thisArg, callback) {
  var self = this;

  if (this.async) {
    _asyncEverySeries(fns, function apply(fn, next) {
      if (Array.isArray(fn)) {
        return _asyncEverySeries(fn, apply, next);
      }
      else if (typeof fn == 'function') {
        fn.apply(thisArg, fns.captures.concat(next));
      }
    }, function () {
      //
      // Ignore the response here. Let the routed take care
      // of themselves and eagerly return true.
      //

      if (callback) {
        callback.apply(thisArg, arguments);
      }
    });
  }
  else {
    _every(fns, function apply(fn) {
      if (Array.isArray(fn)) {
        return _every(fn, apply);
      }
      else if (typeof fn === 'function') {
        return fn.apply(thisArg, fns.captures || null);
      }
      else if (typeof fn === 'string' && self.resource) {
        self.resource[fn].apply(thisArg, fns.captures || null);
      }
    });
  }
};

//
// ### function traverse (method, path, routes, regexp)
// #### @method {string} Method to find in the `routes` table.
// #### @path {string} Path to find in the `routes` table.
// #### @routes {Object} Partial routing table to match against
// #### @regexp {string} Partial regexp representing the path to `routes`.
// #### @filter {function} Filter function for filtering routes (expensive).
// Core routing logic for `director.Router`: traverses the
// specified `path` within `this.routes` looking for `method`
// returning any `fns` that are found.
//
Router.prototype.traverse = function (method, path, routes, regexp, filter) {
  var fns = [],
      current,
      exact,
      match,
      next,
      that;

  function filterRoutes(routes) {
    if (!filter) {
      return routes;
    }

    function deepCopy(source) {
      var result = [];
      for (var i = 0; i < source.length; i++) {
        result[i] = Array.isArray(source[i]) ? deepCopy(source[i]) : source[i];
      }
      return result;
    }

    function applyFilter(fns) {
      for (var i = fns.length - 1; i >= 0; i--) {
        if (Array.isArray(fns[i])) {
          applyFilter(fns[i]);
          if (fns[i].length === 0) {
            fns.splice(i, 1);
          }
        }
        else {
          if (!filter(fns[i])) {
            fns.splice(i, 1);
          }
        }
      }
    }

    var newRoutes = deepCopy(routes);
    newRoutes.matched = routes.matched;
    newRoutes.captures = routes.captures;
    newRoutes.after = routes.after.filter(filter);

    applyFilter(newRoutes);

    return newRoutes;
  }

  //
  // Base Case #1:
  // If we are dispatching from the root
  // then only check if the method exists.
  //
  if (path === this.delimiter && routes[method]) {
    next = [[routes.before, routes[method]].filter(Boolean)];
    next.after = [routes.after].filter(Boolean);
    next.matched = true;
    next.captures = [];
    return filterRoutes(next);
  }

  for (var r in routes) {
    //
    // We dont have an exact match, lets explore the tree
    // in a depth-first, recursive, in-order manner where
    // order is defined as:
    //
    //    ['before', 'on', '<method>', 'after']
    //
    // Remember to ignore keys (i.e. values of `r`) which
    // are actual methods (e.g. `on`, `before`, etc), but
    // which are not actual nested route (i.e. JSON literals).
    //
    if (routes.hasOwnProperty(r) && (!this._methods[r] ||
      this._methods[r] && typeof routes[r] === 'object' && !Array.isArray(routes[r]))) {
      //
      // Attempt to make an exact match for the current route
      // which is built from the `regexp` that has been built
      // through recursive iteration.
      //
      current = exact = regexp + this.delimiter + r;


      if (!this.strict) {
        exact += '[' + this.delimiter + ']?';
      }

      match = path.match(new RegExp('^' + exact));

      if (!match) {
        //
        // If there isn't a `match` then continue. Here, the
        // `match` is a partial match. e.g.
        //
        //    '/foo/bar/buzz'.match(/^\/foo/)   // ['/foo']
        //    '/no-match/route'.match(/^\/foo/) // null
        //
        continue;
      }

      if (match[0] && match[0] == path && routes[r][method]) {
        //
        // ### Base case 2:
        // If we had a `match` and the capture is the path itself,
        // then we have completed our recursion.
        //
        next = [[routes[r].before, routes[r][method]].filter(Boolean)];
        next.after = [routes[r].after].filter(Boolean);
        next.matched = true;
        next.captures = match.slice(1);

        if (this.recurse && routes === this.routes) {
          next.push([routes.before, routes.on].filter(Boolean));
          next.after = next.after.concat([routes.after].filter(Boolean));
        }

        return filterRoutes(next);
      }

      //
      // ### Recursive case:
      // If we had a match, but it is not yet an exact match then
      // attempt to continue matching against the next portion of the
      // routing table.
      //
      next = this.traverse(method, path, routes[r], current);

      //
      // `next.matched` will be true if the depth-first search of the routing
      // table from this position was successful.
      //
      if (next.matched) {
        //
        // Build the in-place tree structure representing the function
        // in the correct order.
        //
        if (next.length > 0) {
          fns = fns.concat(next);
        }

        if (this.recurse) {
          fns.push([routes[r].before, routes[r].on].filter(Boolean));
          next.after = next.after.concat([routes[r].after].filter(Boolean));

          if (routes === this.routes) {
            fns.push([routes['before'], routes['on']].filter(Boolean));
            next.after = next.after.concat([routes['after']].filter(Boolean));
          }
        }

        fns.matched = true;
        fns.captures = next.captures;
        fns.after = next.after;

        //
        // ### Base case 2:
        // Continue passing the partial tree structure back up the stack.
        // The caller for `dispatch()` will decide what to do with the functions.
        //
        return filterRoutes(fns);
      }
    }
  }

  return false;
};

//
// ### function insert (method, path, route, context)
// #### @method {string} Method to insert the specific `route`.
// #### @path {Array} Parsed path to insert the `route` at.
// #### @route {Array|function} Route handlers to insert.
// #### @parent {Object} **Optional** Parent "routes" to insert into.
// Inserts the `route` for the `method` into the routing table for
// this instance at the specified `path` within the `context` provided.
// If no context is provided then `this.routes` will be used.
//
Router.prototype.insert = function (method, path, route, parent) {
  var methodType,
      parentType,
      isArray,
      nested,
      part;

  path = path.filter(function (p) {
    return p && p.length > 0;
  });

  parent = parent || this.routes;
  part = path.shift();
  if (/\:|\*/.test(part) && !/\\d|\\w/.test(part)) {
    part = regifyString(part, this.params);
  }

  if (path.length > 0) {
    //
    // If this is not the last part left in the `path`
    // (e.g. `['cities', 'new-york']`) then recurse into that
    // child
    //
    parent[part] = parent[part] || {};
    return this.insert(method, path, route, parent[part]);
  }

  //
  // If there is no part and the path has been exhausted
  // and the parent is the root of the routing table,
  // then we are inserting into the root and should
  // only dive one level deep in the Routing Table.
  //
  if (!part && !path.length && parent === this.routes) {
    methodType = typeof parent[method];

    switch (methodType) {
      case 'function':
        parent[method] = [parent[method], route];
        return;
      case 'object':
        parent[method].push(route);
        return;
      case 'undefined':
        parent[method] = route;
        return;
    }

    return;
  }

  //
  // Otherwise, we are at the end of our insertion so we should
  // insert the `route` based on the `method` after getting the
  // `parent` of the last `part`.
  //
  parentType = typeof parent[part];
  isArray = Array.isArray(parent[part]);

  if (parent[part] && !isArray && parentType == 'object') {
    methodType = typeof parent[part][method];

    switch (methodType) {
      case 'function':
        parent[part][method] = [parent[part][method], route];
        return;
      case 'object':
        parent[part][method].push(route);
        return;
      case 'undefined':
        parent[part][method] = route;
        return;
    }
  }
  else if (parentType == 'undefined') {
    nested = {};
    nested[method] = route;
    parent[part] = nested;
    return;
  }

  throw new Error('Invalid route context: ' + parentType);
};


//
// ### function extend (methods)
// #### @methods {Array} List of method names to extend this instance with
// Extends this instance with simple helper methods to `this.on`
// for each of the specified `methods`
//
Router.prototype.extend = function(methods) {
  var self = this,
      len = methods.length,
      i;

  function extend(method) {
    self._methods[method] = true;
    self[method] = function () {
      var extra = arguments.length === 1
        ? [method, '']
        : [method];

      self.on.apply(self, extra.concat(Array.prototype.slice.call(arguments)));
    };
  }

  for (i = 0; i < len; i++) {
    extend(methods[i]);
  }
};

//
// ### function mount (routes, context)
// #### @routes {Object} Routes to mount onto this instance
// Mounts the sanitized `routes` onto the root context for this instance.
//
// e.g.
//
//    new Router().mount({ '/foo': { '/bar': function foobar() {} } })
//
// yields
//
//    { 'foo': 'bar': function foobar() {} } }
//
Router.prototype.mount = function(routes, path) {
  if (!routes || typeof routes !== "object" || Array.isArray(routes)) {
    return;
  }

  var self = this;
  path = path || [];
  if (!Array.isArray(path)) {
    path = path.split(self.delimiter);
  }

  function insertOrMount(route, local) {
    var rename = route,
        parts = route.split(self.delimiter),
        routeType = typeof routes[route],
        isRoute = parts[0] === "" || !self._methods[parts[0]],
        event = isRoute ? "on" : rename;

    if (isRoute) {
      rename = rename.slice((rename.match(new RegExp(self.delimiter)) || [''])[0].length);
      parts.shift();
    }

    if (isRoute && routeType === 'object' && !Array.isArray(routes[route])) {
      local = local.concat(parts);
      self.mount(routes[route], local);
      return;
    }

    if (isRoute) {
      local = local.concat(rename.split(self.delimiter));
    }

    self.insert(event, local, routes[route]);
  }

  for (var route in routes) {
    if (routes.hasOwnProperty(route)) {
      insertOrMount(route, path.slice(0));
    }
  }
};

});

require.define("/director/http/index.js",function(require,module,exports,__dirname,__filename,process){var events = require('events'),
    qs = require('querystring'),
    util = require('util'),
    director = require('../../director'),
    responses = require('./responses');

//
// ### Expose all HTTP methods and responses
//
exports.methods   = require('./methods');
Object.keys(responses).forEach(function (name) {
  exports[name] = responses[name];
});

//
// ### function Router (routes)
// #### @routes {Object} **Optional** Routing table for this instance.
// Constuctor function for the HTTP Router object responsible for building
// and dispatching from a given routing table.
//
var Router = exports.Router = function (routes) {
  //
  // ### Extend the `Router` prototype with all of the RFC methods.
  //
  this.params   = {};
  this.routes   = {};
  this.methods  = ['on', 'after', 'before'];
  this.scope    = [];
  this._methods = {};
  this.recurse = 'forward';
  this._attach = [];

  this.extend(exports.methods.concat(['before', 'after']));
  this.configure();
  this.mount(routes || {});
};

//
// Inherit from `director.Router`.
//
util.inherits(Router, director.Router);

//
// ### function configure (options)
// #### @options {Object} **Optional** Options to configure this instance with
// Configures this instance with the specified `options`.
//
Router.prototype.configure = function (options) {
  options = options || {};

  // useful when using connect's bodyParser
  this.stream = options.stream || false;

  return director.Router.prototype.configure.call(this, options);
};

//
// ### function on (method, path, route)
// #### @method {string} **Optional** Method to use
// #### @path {string} Path to set this route on.
// #### @route {Array|function} Handler for the specified method and path.
// Adds a new `route` to this instance for the specified `method`
// and `path`.
//
Router.prototype.on = function (method, path) {
  var args = Array.prototype.slice.call(arguments, 2),
      route = args.pop(),
      options = args.pop(),
      accept;

  if (options) {
    if (options.stream) {
      route.stream = true;
    }

    if (options.accept) {
      this._hasAccepts = true;
      accept = options.accept;
      route.accept = (Array.isArray(accept) ? accept : [accept]).map(function (a) {
        return typeof a === 'string' ? RegExp(a) : a;
      });
    }
  }

  director.Router.prototype.on.call(this, method, path, route);
};

//
// ### function attach (func)
// ### @func {function} Function to execute on `this` before applying to router function
// Ask the router to attach objects or manipulate `this` object on which the
// function passed to the http router will get applied
Router.prototype.attach = function (func) {
  this._attach.push(func);
};

//
// ### function dispatch (method, path)
// #### @req {http.ServerRequest} Incoming request to dispatch.
// #### @res {http.ServerResponse} Outgoing response to dispatch.
// #### @callback {function} **Optional** Continuation to respond to for async scenarios.
// Finds a set of functions on the traversal towards
// `method` and `path` in the core routing table then
// invokes them based on settings in this instance.
//
Router.prototype.dispatch = function (req, res, callback) {
  //
  // Dispatch `HEAD` requests to `GET`
  //
  var method = req.method === 'HEAD' ? 'get' : req.method.toLowerCase(),
      thisArg = { req: req, res: res },
      self = this,
      contentType,
      runlist,
      stream,
      error,
      fns,
      url;

  //
  // Trap bad URLs from `decodeUri`
  //
  try { url = decodeURI(req.url.split('?', 1)[0]) }
  catch (ex) { url = null }

  if (url && this._hasAccepts) {
    contentType = req.headers['content-type'];
    fns = this.traverse(method, url, this.routes, '', function (route) {
      return !route.accept || route.accept.some(function (a) {
        return a.test(contentType);
      });
    });
  }
  else if (url) {
    fns = this.traverse(method, url, this.routes, '');
  }

  if (this._attach) {
    for (var i in this._attach) {
      this._attach[i].call(thisArg);
    }
  }

  if (!fns || fns.length === 0) {
    error = new exports.NotFound('Could not find path: ' + req.url);
    if (typeof this.notfound === 'function') {
      this.notfound.call(thisArg, callback);
    }
    else if (callback) {
      callback.call(thisArg, error, req, res);
    }
    return false;
  }

  if (this.recurse === 'forward') {
    fns = fns.reverse();
  }

  runlist = this.runlist(fns);
  stream  = this.stream || runlist.some(function (fn) { return fn.stream === true; });

  function parseAndInvoke() {
    error = self.parse(req);
    if (error) {
      if (callback) {
        callback.call(thisArg, error, req, res);
      }
      return false;
    }

    self.invoke(runlist, thisArg, callback);
  }

  if (!stream) {
    //
    // If there is no streaming required on any of the functions on the
    // way to `path`, then attempt to parse the fully buffered request stream
    // once it has emitted the `end` event.
    //
    if (req.readable) {
      //
      // If the `http.ServerRequest` is still readable, then await
      // the end event and then continue
      //
      req.once('end', parseAndInvoke);
    }
    else {
      //
      // Otherwise, just parse the body now.
      //
      parseAndInvoke();
    }
  }
  else {
    this.invoke(runlist, thisArg, callback);
  }

  return true;
};

//
// ### @parsers {Object}
// Lookup table of parsers to use when attempting to
// parse incoming responses.
//
Router.prototype.parsers = {
  'application/x-www-form-urlencoded': qs.parse,
  'application/json': JSON.parse
};

//
// ### function parse (req)
// #### @req {http.ServerResponse|BufferedStream} Incoming HTTP request to parse
// Attempts to parse `req.body` using the value found at `req.headers['content-type']`.
//
Router.prototype.parse = function (req) {
  function mime(req) {
    var str = req.headers['content-type'] || '';
    return str.split(';')[0];
  }

  var parser = this.parsers[mime(req)],
      body;

  if (parser) {
    req.body = req.body || '';

    if (req.chunks) {
      req.chunks.forEach(function (chunk) {
        req.body += chunk;
      });
    }

    try {
      req.body = req.body && req.body.length
        ? parser(req.body)
        : {};
    }
    catch (err) {
      return new exports.BadRequest('Malformed data');
    }
  }
};

});

require.define("events",function(require,module,exports,__dirname,__filename,process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};
});

require.define("querystring",function(require,module,exports,__dirname,__filename,process){var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    };

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}


/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{ 
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[objectKeys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}
});

require.define("util",function(require,module,exports,__dirname,__filename,process){var events = require('events');

exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};
});

require.define("/director.js",function(require,module,exports,__dirname,__filename,process){


exports.Router = require('./director/router').Router;
exports.http   = require('./director/http');
exports.cli    = require('./director/cli');
});

require.define("/director/cli.js",function(require,module,exports,__dirname,__filename,process){
var util = require('util'),
    director = require('../director');

var Router = exports.Router = function (routes) {
  director.Router.call(this, routes);
  this.recurse = 'backward';
};

//
// Inherit from `director.Router`.
//
util.inherits(Router, director.Router);

//
// ### function configure (options)
// #### @options {Object} **Optional** Options to configure this instance with
// Configures this instance with the specified `options`.
//
Router.prototype.configure = function (options) {
  options = options || {};
  director.Router.prototype.configure.call(this, options);

  //
  // Delimiter must always be `\s` in CLI routing.
  // e.g. `jitsu users create`
  //
  this.delimiter = '\\s';
  return this;
};

//
// ### function dispatch (method, path)
// #### @method {string} Method to dispatch
// #### @path {string} Path to dispatch
// Finds a set of functions on the traversal towards
// `method` and `path` in the core routing table then
// invokes them based on settings in this instance.
//
Router.prototype.dispatch = function (method, path, tty, callback) {
  //
  // Prepend a single space onto the path so that the traversal
  // algorithm will recognize it. This is because we always assume
  // that the `path` begins with `this.delimiter`.
  //
  path = ' ' + path;
  var fns = this.traverse(method, path, this.routes, '');
  if (!fns || fns.length === 0) {
    if (typeof this.notfound === 'function') {
      this.notfound.call({ tty: tty, cmd: path }, callback);
    }
    else if (callback) {
      callback(new Error('Could not find path: ' + path));
    }

    return false;
  }

  if (this.recurse === 'forward') {
    fns = fns.reverse();
  }

  this.invoke(this.runlist(fns), { tty: tty, cmd: path }, callback);
  return true;
};
});

require.define("/director/http/responses.js",function(require,module,exports,__dirname,__filename,process){//
// HTTP Error objectst
//
var util = require('util');

exports.NotModified = function () {
  this.status = 304;
  this.options = {
    removeContentHeaders: true
  };
};

util.inherits(exports.NotModified, Error);

exports.BadRequest = function (msg) {
  msg = msg || 'Bad request';

  this.status = 400;
  this.headers = {};
  this.message = msg;
  this.body = { error: msg };
};

util.inherits(exports.BadRequest, Error);

exports.NotAuthorized = function (msg) {
  msg = msg || 'Not Authorized';

  this.status = 401;
  this.headers = {};
  this.message = msg;
  this.body = { error: msg };
};

util.inherits(exports.NotAuthorized, Error);

exports.Forbidden = function (msg) {
  msg = msg || 'Not Authorized';

  this.status = 403;
  this.headers = {};
  this.message = msg;
  this.body = { error: msg };
};

util.inherits(exports.Forbidden, Error);

exports.NotFound = function (msg) {
  msg = msg || 'Not Found';

  this.status = 404;
  this.headers = {};
  this.message = msg;
  this.body = { error: msg };
};

util.inherits(exports.NotFound, Error);

exports.MethodNotAllowed = function (allowed) {
  var msg = 'method not allowed.';

  this.status = 405;
  this.headers = { allow: allowed };
  this.message = msg;
  this.body = { error: msg };
};

util.inherits(exports.MethodNotAllowed, Error);

exports.NotAcceptable = function (accept) {
  var msg = 'cannot generate "' + accept + '" response';

  this.status = 406;
  this.headers = {};
  this.message = msg;
  this.body = {
    error: msg,
    only: 'application/json'
  };
};

util.inherits(exports.NotAcceptable, Error);

exports.NotImplemented = function (msg) {
  msg = msg || 'Not Implemented';

  this.status = 501;
  this.headers = {};
  this.message = msg;
  this.body = { error: msg };
};

util.inherits(exports.NotImplemented, Error);
});

require.define("/director/http/methods.js",function(require,module,exports,__dirname,__filename,process){/*!
 * Express - router - methods
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 *
 * Adapted for SS
 * (C) 2011 Nodejitsu Inc. <info@nodejitsu.com>
 *
 */

/**
 * Hypertext Transfer Protocol -- HTTP/1.1
 * http://www.ietf.org/rfc/rfc2616.txt
 */
var RFC2616 = ['OPTIONS', 'GET', 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT'];

/**
 * HTTP Extensions for Distributed Authoring -- WEBDAV
 * http://www.ietf.org/rfc/rfc2518.txt
 */
var RFC2518 = ['PROPFIND', 'PROPPATCH', 'MKCOL', 'COPY', 'MOVE', 'LOCK', 'UNLOCK'];

/**
 * Versioning Extensions to WebDAV
 * http://www.ietf.org/rfc/rfc3253.txt
 */
var RFC3253 = ['VERSION-CONTROL', 'REPORT', 'CHECKOUT', 'CHECKIN', 'UNCHECKOUT', 'MKWORKSPACE', 'UPDATE', 'LABEL', 'MERGE', 'BASELINE-CONTROL', 'MKACTIVITY'];

/**
 * Ordered Collections Protocol (WebDAV)
 * http://www.ietf.org/rfc/rfc3648.txt
 */
var RFC3648 = ['ORDERPATCH'];

/**
 * Web Distributed Authoring and Versioning (WebDAV) Access Control Protocol
 * http://www.ietf.org/rfc/rfc3744.txt
 */
var RFC3744 = ['ACL'];

/**
 * Web Distributed Authoring and Versioning (WebDAV) SEARCH
 * http://www.ietf.org/rfc/rfc5323.txt
 */
var RFC5323 = ['SEARCH'];

/**
 * PATCH Method for HTTP
 * http://www.ietf.org/rfc/rfc5789.txt
 */
var RFC5789 = ['PATCH'];

/**
 * Expose the methods.
 */
module.exports = [].concat(
  RFC2616,
  RFC2518,
  RFC3253,
  RFC3648,
  RFC3744,
  RFC5323,
  RFC5789
).map(function (method) {
  return method.toLowerCase();
});});

require.define("/director.js",function(require,module,exports,__dirname,__filename,process){


exports.Router = require('./director/router').Router;
exports.http   = require('./director/http');
exports.cli    = require('./director/cli');
});
require("/director.js");
})();
