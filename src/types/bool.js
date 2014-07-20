var assert = require('assert'),
    _ = require('lodash'),
    Value = require('../value'),
    inherits = require('../inherits');

var Bool = function Bool() {
  if (typeof this._raw === 'undefined') {
    this._raw = false;
  }
};

var proto = {
  assertValidValue: function(val) {
    assert.ok(typeof val === 'boolean', 'Bool(): value must be true/false');
  },
  negate: function Bool$negate() {
    this.set(!this._raw);
  }
};

module.exports = inherits(Value, Bool, proto);