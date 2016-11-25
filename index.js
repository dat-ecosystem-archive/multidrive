var hyperdrive = require('hyperdrive')
var explain = require('explain-error')
var concat = require('concat-stream')
var keyBy = require('lodash.keyby')
var mapLimit = require('map-limit')
var series = require('run-series')
var assert = require('assert')
var level = require('level')
var xtend = require('xtend')
var path = require('path')
var pump = require('pump')
var fs = require('fs')

module.exports = createMultiDrive

// manage a collection of hyperdrives
// (str, obj?, fn) -> null
function createMultiDrive (location, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.equal(typeof location, 'string', 'multidrive: location should be a string')
  assert.equal(typeof opts, 'object', 'multidrive: opts should be an object')
  assert.equal(typeof cb, 'function', 'multidrive: cb should be a function')

  var db = level(location)

  var rs = db.createReadStream()
  pump(rs, concat({ encoding: 'json' }, sink), function (err) {
    if (err) cb(err)
  })

  function sink (pairs) {
    mapLimit(pairs, 1, iterator, function (err, archivesArray) {
      if (err) return cb(err)
      var archivesMap = keyBy(archivesArray, function (archive) {
        return archive.metadata.directory
      })
      cb(null, new MultiDrive(db, archivesMap))
    })

    function iterator (pair, done) {
      var directory = pair.key
      var _opts = pair.value

      var secretKeyPath = path.join(directory, 'SECRET_KEY')
      var keyPath = path.join(directory, 'KEY')
      var secretKey = null
      var key = null
      var db = null
      var fns = []

      fns.push(function (done) {
        // TODO: figure out if there's a better way to signal a database was removed
        level(directory, function (err, _db) {
          if (err) return done(explain(err, 'multidrive: error recreating database in ' + directory))
          db = _db
          done()
        })
      })

      fns.push(function (done) {
        fs.readFile(secretKeyPath, function (err, _key) {
          if (err) return done()
          secretKey = _key
          done()
        })
      })

      fns.push(function (done) {
        fs.readFile(keyPath, function (err, _key) {
          if (err) return done()
          key = _key
          done()
        })
      })

      series(fns, function (err) {
        if (err) return done(err)
        var drive = hyperdrive(db)
        var _opts = (secretKey)
          ? xtend(self.opts, opts, { secretKey: secretKey })
          : xtend(self.opts, opts)
        var archive = drive.createArchive(key, _opts)
        archive.metadata.location = directory
        done(null, archive)
      })
    }
  }
}

function MultiDrive (db, archives) {
  this.db = db
  this.archives = archives
}

// (str, obj?, fn) -> null
MultiDrive.prototype.createArchive = function (directory, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.equal(typeof directory, 'string', 'multidrive.createArchive: directory should be a string')
  assert.equal(typeof cb, 'function', 'multidrive.createArchive: cb should be a function')
  assert.ok(!opts.file, 'multidrive.createArchive: passing in opts.file can cause critical errors, opts.file can only be passed into the multidrive constructor to ensure consistency')

  var key = opts.key
  var self = this

  level(directory, function (err, db) {
    if (err) return cb(explain(err, 'multidrive.createArchive: error creating database'))

    var _opts = xtend(self.opts, opts)
    var drive = hyperdrive(db)
    var archive = (key)
      ? drive.createArchive(key, _opts)
      : drive.createArchive(_opts)
    archive.metadata.location = directory

    var secretKeyPath = path.join(directory, 'SECRET_KEY')
    var keyPath = path.join(directory, 'KEY')
    var fns = []

    fns.push(function (done) {
      fs.writeFile(keyPath, archive.metadata.key, function (err) {
        if (err) return done(explain(err, 'multidrive: error writing key to ' + keyPath))
        done()
      })
    })

    fns.push(function (done) {
      var data = {
        sparse: opts.sparse,
        live: opts.live
      }
      self.db.put(directory, data, function (err) {
        if (err) return done(explain(err, 'multidrive.createArchive: error saving directory to database'))
        done()
      })
    })

    if (archive.metadata.secretKey) {
      fns.push(function (done) {
        fs.writeFile(secretKeyPath, archive.metadata.secretKey, function (err) {
          if (err) return done(explain(err, 'multidrive.createArchive: error writing secretKey to ' + secretKeyPath))
          done()
        })
      })
    }

    series(fns, function (err, values) {
      if (err) return cb(err)
      cb(null, archive)
    })
  })
}

// remove an instance from the registry, does not remove the directory itself
// (str, fn) -> null
MultiDrive.prototype.removeArchive = function (directory, cb) {
  assert.equal(typeof directory, 'string', 'multidrive.delete: directory should be a string')
  assert.equal(typeof cb, 'function', 'multidrive.delete: cb should be a function')
  this.db.del(directory, cb)
}

// () -> object
MultiDrive.prototype.list = function () {
  return this.archives
}
