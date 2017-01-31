var concat = require('concat-stream')
var mapLimit = require('map-limit')
var assert = require('assert')
var pump = require('pump')

module.exports = multidrive

function multidrive (db, createArchive, closeArchive, cb) {
  assert.equal(typeof db, 'object', 'multidrive: db should be type object')
  assert.equal(typeof createArchive, 'function', 'multidrive: createArchive should be type function')
  assert.equal(typeof closeArchive, 'function', 'multidrive: closeArchive should be type function')
  assert.equal(typeof cb, 'function', 'multidrive: cb should be type function')

  var archives = []
  var drive = {
    list: list,
    create: create,
    close: close
  }

  var rs = db.createReadStream()
  var ws = concat({ encoding: 'json' }, sink)
  pump(rs, ws)

  function sink (data) {
    mapLimit(data, 1, createArchive, function (err, _archives) {
      if (err) return cb(err)
      archives = _archives
      cb(null, drive)
    })
  }

  function list () {
    return archives
  }

  function create (data, cb) {
    createArchive(data, function (err, archive) {
      if (err) return cb(err)
      var key = archive.key
      var _data = JSON.stringify(data)
      db.put(key, _data, function (err) {
        if (err) return cb(err)
        archives.push(archive)
        cb(null, archive)
      })
    })
  }

  function close (key, cb) {
    var i = 0
    var archive = archives.find(function (archive, j) {
      if (archive.key !== key) return
      i = j
      return true
    })
    if (!archive) return cb(new Error('could not find archive ' + key))
    closeArchive(archive, function (err) {
      if (err) return cb(err)
      db.del(key, function (err) {
        if (err) return cb(err)
        archives.splice(i, 1)
        cb(null, archive)
      })
    })
  }
}
