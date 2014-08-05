var _ = require('lodash'),
    assert = require('assert'),
    uuid = require('node-uuid'),
    Immutable = require('immutable'),
    Literal = require('./literal'),
    Model = require('./model'),
    Collection = require('./collection'),
    Snapshot = require('./snapshot');

var Store = function Store(definition) {
  if (process.env.NODE_ENV !== 'production') {
    assert.ok(_.isPlainObject(definition) && !_.isEmpty(definition), 'Store(): definition must be an object of modelName:string -> modelProps:object');
    _.each(definition, function(model, key) {
      assert.ok(_.isPlainObject(model), 'Store(): each prop must be an object of propName:string -> propType:constructor (eg Model.Str) ' + key);
      _.each(model, function(type, prop) {
        assert.ok(type === Literal || type.prototype instanceof Literal, 'Store(): each prop must be a Literal/Decimal/Str/Bool etc ' + prop);
      })
    });
  }

  var store = {},
      models = {},
      modelName;

  for (modelName in definition) {
    if (definition.hasOwnProperty(modelName)) {
      models[modelName] = Model.define(definition[modelName], modelName);
      store[modelName] = {};
    }
  }
  this._models = models;
  this._source = Immutable.fromJS(store);
  this._snapshot = new Snapshot(this._source);
};

Store.prototype.snapshot = function Store$snapshot() {
  return this._snapshot;
};

Store.prototype.commit = function Store$commit(args) {
  var modelsByPath = _.groupBy(_.isArray(args) ? args : arguments, '_path'),
      source = this._source,
      modelName,
      models,
      model,
      id,
      index,
      length;
  for (modelName in modelsByPath) {
    models = source.get(modelName).asMutable();
    length = modelsByPath[modelName].length;
    for (index = 0; index < length; index++) {
      model = modelsByPath[modelName][index];
      if (model._destroy) {
        if (!model.id) { continue };
        models = models.delete(model.id);
      } else if (model.id) {
        models = models.set(model.id, model);
      } else {
        id = uuid.v4();
        model.id = id;
        model = model.clone();
        model.id = id;
        models = models.set(model.id, model);
      }
    }
    source = source.set(modelName, models.asImmutable());
  }
  this._source = source;
  this._snapshot = new Snapshot(this._source);
};

Store.prototype.get = function Store$get() {
  return this._snapshot.get.apply(this._snapshot, arguments);
};

Store.prototype.create = function Store$create(model, attributes) {
  if (process.env.NODE_ENV !== 'production') {
    assert.ok(model in this._models, 'Store(): model not defined ' + model);
    assert.ok(!attributes || _.isPlainObject(attributes), 'Store(): attributes is an optional object');
  }
  return new this._models[model](attributes);
};

module.exports = Store;