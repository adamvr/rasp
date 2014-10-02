/**
 * Module dependencies
 */
var request = require('superagent')
  , fs = require('fs')
  , cheerio = require('cheerio')
  , _ = require('underscore');

/**
 * Rasp
 */
var Rasp = module.exports = function Rasp (opts) {
  if (!(this instanceof Rasp)) return new Rasp (opts);

  opts = opts || {};
};

Rasp.prototype.sense = function (sensor) {
  sensor = _.isArray(sensor) ? sensor : _.toArray(arguments);
  return this._sensors = this._sensors.concat(sensor), this;
};

Rasp.prototype.scrape = function (src, content, cb) {
  this._fetch(src, function (err, test) {
    if (err) return cb(err);
    return this._run(text, cb);
  }.bind(this));
};

Rasp.prototype._fetch = function (src, cb) {
  if (/http/.test(src)) {
    request
      .get(src)
      .end(function (err, res) {
        return cb(err, res.text)
      });
  } else if (fs.existsSync(src)) {
    fs.readFile(src, 'utf8', cb);
  } else {
    cb(null, src);
  }

  return this;
};

Rasp.prototype._run = function (text, cb) {
  var index = 0
    , done = false
    , result = {}
    , sensors = this._sensors
    , selector = this._content
    , res = {}
    , error;

  // Wrap document in cheerio selector
  var $ = cheerio.load(text);

  // Build doc object
  var doc = { text: text, $: $, content: selector };

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
