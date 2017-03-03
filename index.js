var mapLimit = require('map-limit')
var assert = require('assert')

module.exports = multidrive

function multidrive (store, _createArchive, closeArchive, cb) {
  assert.equal(typeof store, 'object', 'multidrive: store should be type object')
  assert.equal(typeof _createArchive, 'function', 'multidrive: createArchive should be type function')
  assert.equal(typeof closeArchive, 'function', 'multidrive: closeArchive should be type function')
  assert.equal(typeof cb, 'function', 'multidrive: cb should be type function')

  function createArchive (data, cb) {
    _createArchive(data, function (err, archive) {
      if (err) return cb(err)
      archive._data = data || {}
      cb(null, archive)
    })
  }

  var archives = []
  var drive = {
    list: list,
    create: create,
    close: close,
    setMeta: setMeta,
    getMeta: getMeta
  }

  store.read(sink)

  function sink (err, data) {
    if (err) return cb(err)
    var values = Object.keys(data).map(function (key) {
      return JSON.parse(data[key])
    })

    mapLimit(values, 1, createArchive, function (err, _archives) {
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

      var duplicates = archives.filter(function (_archive) {
        return _archive.key === key
      })
      if (duplicates.length) return cb(null, duplicates[0])

      var _data
      if (data) _data = JSON.stringify(data)
      store.write(key, _data, function (err) {
        if (err) return cb(err)
        archives.push(archive)
        cb(null, archive)
      })
    })
  }

  function close (key, cb) {
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    var i = 0
    var archive = archives.find(function (archive, j) {
      if (archive.key.toString('hex') !== key) return
      i = j
      return true
    })
    if (!archive) return cb(new Error('could not find archive ' + key))
    closeArchive(archive, function (err) {
      if (err) return cb(err)
      store.delete(key, function (err) {
        if (err) return cb(err)
        archives.splice(i, 1)
        cb(null, archive)
      })
    })
  }

  function setMeta (key, meta, cb) {
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    var archive = archives.find(function (archive) {
      return archive.key.toString('hex') === key
    })
    if (!archive) return cb(new Error('could not find archive ' + key))
    archive.meta = meta
    archive._data.meta = meta
    store.write(archive.key, JSON.stringify(archive._data), cb)
  }

  function getMeta (key) {
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    var archive = archives.find(function (archive) {
      return archive.key.toString('hex') === key
    })
    if (!archive) return cb(new Error('could not find archive ' + key))
    return archive.meta || {}
  }
}
