const level = require('named-level-store')
const hyperdrive = require('hyperdrive')
const concat = require('concat-stream')
const assert = require('assert')
const pump = require('pump')

module.exports = Multidrive

// manage a collection of hyperdrives
// (str, fn) -> null
function Multidrive (name, cb) {
  assert.equal(typeof name, 'string', 'multidrive: name should be a string')
  assert.equal(typeof cb, 'function', 'multidrive: cb should be a function')

  const self = this

  this.db = level(name)
  this.drives = {}
  this.queue = []

  const rs = this.db.createKeyStream()
  pump(rs, concat({ encoding: 'json' }, sink), (err) => {
    if (err) return cb(err)
  })

  function sink (keys) {
    keys.forEach((key) => {
      const db = level(name)
      const drive = hyperdrive(db)
      self.drives[key] = drive
    })

    while (self.queue) self.queue.shift()()
  }
}

// (str, fn) -> null
Multidrive.prototype.create = function (name, cb) {
  assert.equal(typeof name, 'string', 'multidrive.create: name should be a string')
  assert.equal(typeof cb, 'function', 'multidrive.create: cb should be a function')

  const db = level(name)
  const drive = hyperdrive(db)

  this.db.put(name, db.location, function (err) {
    if (err) return cb(err)
    cb(null, drive)
  })
}

// (str, fn) -> null
Multidrive.prototype.delete = function (name, cb) {
  assert.equal(typeof name, 'string', 'multidrive.delete: name should be a string')
  assert.equal(typeof cb, 'function', 'multidrive.delete: cb should be a function')
  this.db.del(name, cb)
}

// (fn) -> null
Multidrive.prototype.list = function (cb) {
  assert.equal(typeof cb, 'function', 'multidrive.list: cb should be a function')
  if (this.ready) cb(null, this.drives)
  else this.queue.push(cb)
}
