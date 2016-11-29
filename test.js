var raf = require('random-access-file')
var rimraf = require('rimraf')
var test = require('tape')
var uuid = require('uuid')
var path = require('path')

var multidrive = require('./')

test('drive = multidrive', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(3)
    t.throws(multidrive, /location/)
    t.throws(multidrive.bind(null, 'hi'), /function/)
    t.throws(multidrive.bind(null, 'hi', 'hi', 'hi'), /object/)
  })
})

test('drive.createArchive', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(3)
    var location = path.join('/tmp', uuid())

    multidrive(location, function (err, drive) {
      t.ifError(err, 'no err')
      t.throws(drive.createArchive, /directory/)
      t.throws(drive.createArchive.bind(drive, '/foo/bar', 'nope'), /function/)
      rimraf.sync(location)
    })
  })

  t.test('should create an archive', function (t) {
    t.plan(3)
    var location = path.join('/tmp', uuid())

    var opts = {
      file: function (name, dir) { return raf(path.join(dir, name)) }
    }
    multidrive(location, opts, function (err, drive) {
      t.ifError(err, 'no err')

      var archiveDir = path.join('/tmp', uuid())
      drive.createArchive(archiveDir, function (err, archive) {
        t.ifError(err, 'no err')
        t.ok(archive)
        rimraf.sync(location)
        rimraf.sync(archiveDir)
      })
    })
  })
})

test('drive.removeDrive', function (t) {
  t.fail()
  t.end()
})

test('drive.list', function (t) {
  t.test('should list new archives', function (t) {
    t.plan(4)
    var location = path.join('/tmp', uuid())

    multidrive(location, function (err, drive) {
      t.ifError(err, 'no err')

      var archiveDir = path.join('/tmp', uuid())
      drive.createArchive(archiveDir, function (err, archive) {
        t.ifError(err, 'no err')

        var archives = drive.list()
        t.ok(archives)
        t.equal(archives[archive.metadata.location], archive)

        rimraf.sync(location)
        rimraf.sync(archiveDir)
      })
    })
  })

  t.test('should list persisted archives', function (t) {
    t.plan(7)
    var location = path.join('/tmp', uuid())

    multidrive(location, function (err, drive) {
      t.ifError(err, 'no err')

      var archiveDir = path.join('/tmp', uuid())
      drive.createArchive(archiveDir, function (err, archive) {
        t.ifError(err, 'no err')
        t.ok(archive.owner, 'owner after creation')

        drive.close(function (err) {
          t.ifError(err, 'no err')

          multidrive(location, function (err, drive) {
            t.ifError(err, 'no err')

            var archives = drive.list()
            t.ok(archives, 'archives loaded')
            t.ok(archives[archive.metadata.location], 'archive exists')
            t.ok(archives[archive.metadata.location].owner, 'still owner')

            rimraf.sync(location)
            rimraf.sync(archiveDir)
          })
        })
      })
    })
  })
})
