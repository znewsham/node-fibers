const { AsyncResource, executionAsyncResource } = require('async_hooks');
const { timeStamp } = require('console');
const _Fiber = require('./fibers.js');

const weakMap = new WeakMap();
const Fiber = function Fiber(...args) {
  if (!(this instanceof Fiber)) {
    return new Fiber(...args);
  }

  const _private = {
    _ar: new AsyncResource('Fiber'),
    _fiber: _Fiber(...args)
  };
  weakMap.set(this, _private);
  _private._fiber._f = this;
  return this;
};

Fiber.__proto__ = _Fiber;

Object.defineProperty(Fiber, 'current', {
  get() {
    return _Fiber.current && _Fiber.current._f;
  }
})

_Fiber[Symbol.hasInstance] = function(obj) {
  // hacky
  return obj instanceof Fiber || obj.run;
};

Fiber.yield = function(...args) {
  const _ar = Fiber.current._ar;
  const _ar1 = executionAsyncResource();
  const ret = _Fiber.yield(...args);
  const _arNext = Fiber.current._ar;
  const _arNext1 = executionAsyncResource();
  Fiber.current._ar = _arNext1;
  return ret;
};

module.exports = Fiber;
Fiber.prototype = {
  __proto__: Fiber,
  get current() {
    return _Fiber.current._f;
  },

  yield(...args) {
    const ret = Fiber.yield(...args);
    return ret;
  },

  get _ar() {
    return weakMap.get(this)._ar;
  },

  // because of promise fiber pool, we want this.
  set _ar(ar) {
    return weakMap.get(this)._ar = ar;
  },

  get _fiber() {
    return weakMap.get(this)._fiber;
  },

  run(...args) {
    return this._ar.runInAsyncScope(() => this._fiber.run(...args));
  },

  throwInto(...args) {
    return this._ar.runInAsyncScope(() => this._fiber.throwInto(...args));
  }
}
