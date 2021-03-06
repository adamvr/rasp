/**
 * Module dependencies
 */
var request = require('superagent')
  , fs = require('fs')
  , cheerio = require('cheerio')
  , q = require('q')
  , debug = require('debug')('rasp')
  , _ = require('underscore');

/**
 * Rasp
 */
var Rasp = module.exports = function Rasp (opts) {
  if (!(this instanceof Rasp)) return new Rasp (opts);

  opts = opts || {};
};

Rasp.prototype._sensors = [];

Rasp.prototype.sense = function (sensor) {
  sensor = _.isArray(sensor) ? sensor : _.toArray(arguments);
  debug('adding sensors %s', sensor);
  return this._sensors = this._sensors.concat(sensor), this;
};

Rasp.prototype.scrape = function (src, opts, cb) {
  var deferred = q.defer();

  debug('scraping %s with options %j', src, opts);

  this._fetch(src, function (err, text) {
    if (err) return deferred.reject(err);
    return this._run(text, opts, function (err, res) {
      if (err) return deferred.reject(err);
      return deferred.resolve(res);
    });
  }.bind(this));

  return deferred.promise.nodeify(cb);
};

Rasp.prototype._fetch = function (src, cb) {
  if (/^http/.test(src)) {
    debug('fetching %s over http', src);
    request
      .get(src)
      .end(function (err, res) {
        return cb(err, res.text)
      });
  } else if (fs.existsSync(src)) {
    debug('fetching %s from filesystem', src);
    fs.readFile(src, 'utf8', cb);
  } else {
    debug('fetching in string mode');
    cb(null, src);
  }

  return this;
};

Rasp.prototype._run = function (text, opts, cb) {
  var index = 0
    , done = false
    , result = {}
    , sensors = this._sensors
    , res = {}
    , error;

  // Wrap document in cheerio selector
  var $ = cheerio.load(text);

  // Build doc object
  var doc = { text: text, $: $, opts: opts, content: opts.content };

  // Build result object
  var res = {};

  // Bootstrap
  next.call(this);

  return this;

  function next (err) {
    // Got an error, shut it down
    if (err) return done = true, cb(err);
    // Already finished somewhere, float away
    if (done) return;

    // Grab next sensor
    var sensor = sensors[index++];

    // No sensors left, callback with the result
    if (!sensor) return done = true, cb(null, res);

    // Run the next sensor
    sensor.call(this, doc, res, _.once(next));
  }
};
