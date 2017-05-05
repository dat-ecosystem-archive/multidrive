var mapLimit = require('map-limit')
var assert = require('assert')
var debug = require('debug')('multidrive')

module.exports = multidrive

function multidrive (store, createArchive, closeArchive, cb) {
  assert.equal(typeof store, 'object', 'multidrive: store should be type object')
  assert.equal(typeof createArchive, 'function', 'multidrive: createArchive should be type function')
  assert.equal(typeof closeArchive, 'function', 'multidrive: closeArchive should be type function')
  assert.equal(typeof cb, 'function', 'multidrive: cb should be type function')

  var archives = []
  var drive = {
    list: list,
    create: create,
    close: close
  }

  debug('initialize')
  store.read(sink)

  function sink (err, data) {
    if (err) return cb(err)
    var values = Object.keys(data).map(function (key) {
      return JSON.parse(data[key])
    })
    debug('found %s dats', values.length)

    mapLimit(values, 1, createArchive, function (err, _archives) {
      if (err) return cb(err)
      archives = _archives
      debug('initialized')
      cb(null, drive)
    })
  }

  function list () {
    return archives
  }

  function create (data, cb) {
    debug('create archive data=%j', data)
    createArchive(data, function (err, archive) {
      if (err) return cb(err)
      var key = archive.key
      var hexKey = key.toString('hex')
      debug('archive created key=%s', hexKey)

      var duplicates = archives.filter(function (_archive) {
        return _archive.key === key
      })
      var duplicate = duplicates[0]
      if (duplicate) {
        debug('archive duplicate key=%s', hexKey)
        return cb(null, duplicate, Boolean(duplicate))
      }

      var _data
      if (data) _data = JSON.stringify(data)
      store.write(key, _data, function (err) {
        if (err) return cb(err)
        debug('archive stored key=%s', hexKey)
        archives.push(archive)
        cb(null, archive)
      })
    })
  }

  function close (key, cb) {
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    debug('close archive key=%s', key)
    var i = 0
    var archive = archives.find(function (archive, j) {
      if (archive.key.toString('hex') !== key) return
      i = j
      return true
    })
    if (!archive) return cb(new Error('could not find archive ' + key))
    closeArchive(archive, function (err) {
      if (err) return cb(err)
      debug('archive closed key=%s', key)
      store.delete(key, function (err) {
        if (err) return cb(err)
        debug('archive deleted key=%s', key)
        archives.splice(i, 1)
        cb(null, archive)
      })
    })
  }
}
