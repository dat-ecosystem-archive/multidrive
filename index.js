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
  var _disconnected = false
  var drive = {
    list: list,
    create: create,
    close: close,
    disconnect: disconnect
  }

  debug('initialize')
  store.read(sink)

  function sink (err, data) {
    if (err) return cb(err)
    var values = Object.keys(data).map(function (key) {
      var value = JSON.parse(data[key])
      value.key = key
      return value
    })
    debug('found %s dats', values.length)

    function createWithoutError (data, cb) {
      try {
        createArchive(data, function (err, dat) {
          if (err) {
            err.data = data
            dat = err
            err = null
          }
          cb(err, dat)
        })
      } catch (err) {
        err.data = data
        cb(null, err)
      }
    }

    mapLimit(values, 1, createWithoutError, function (err, _archives) {
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
    if (_disconnected) return setImmediate(cb.bind(null, new Error('disconnected')))
    debug('create archive data=%j', data)
    createArchive(data, function (err, archive) {
      if (err) return cb(err)
      if (archive instanceof Error) {
        archives.push(archive)
        return cb(null, archive)
      }
      var key = archive.key
      var hexKey = key.toString('hex')
      debug('archive created key=%s', hexKey)

      var duplicates = archives.filter(function (_archive) {
        if (_archive instanceof Error) return false
        var a = Buffer(_archive.key)
        var b = Buffer(key)
        return a.equals(b)
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

  function disconnect (cb) {
    if (_disconnected) return setImmediate(cb.bind(null, new Error('disconnected')))
    _disconnected = true
    store = null
    if (archives.length === 0) return setImmediate(cb)
    var _archives = archives
    var count = _archives.length
    var _err
    _archives.forEach(function (archive) {
      closeArchive(archive, next)
    })
    archives = []

    function next (err) {
      count--
      if (err && !_err) {
        _err = err
      }
      if (count === 0) {
        cb(_err)
      }
    }
  }

  function close (key, cb) {
    if (_disconnected) return setImmediate(cb.bind(null, new Error('disconnected')))
    if (Buffer.isBuffer(key)) key = key.toString('hex')
    debug('close archive key=%s', key)
    var i = 0
    var archive = archives.find(function (archive, j) {
      var _key = (archive.key || archive.data.key).toString('hex')
      if (_key !== key) return
      i = j
      return true
    })
    if (!archive) return setImmediate(cb.bind(null, new Error('could not find archive ' + key)))
    if (archive instanceof Error) next()
    else closeArchive(archive, next)

    function next (err) {
      if (err) return cb(err)
      debug('archive closed key=%s', key)
      store.delete(key, function (err) {
        if (err) return cb(err)
        debug('archive deleted key=%s', key)
        archives.splice(i, 1)
        cb(null, archive)
      })
    }
  }
}
