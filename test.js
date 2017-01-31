var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var test = require('tape')

var noop = function () {}
var multidrive = require('./')

test('drive = multidrive', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(3)
    t.throws(multidrive.bind(null), /object/)
    t.throws(multidrive.bind(null, {}), /function/)
    t.throws(multidrive.bind(null, {}, noop), /function/)
  })
})

test('drive.create', function (t) {
  t.test('should create an archive', function (t) {
    t.plan(5)

    var db = memdb()
    multidrive(db, createArchive, noop, function (err, drive) {
      t.ifError(err, 'no err')
      t.equal(typeof drive, 'object', 'drive was returned')
      drive.create(null, function (err, archive) {
        t.ifError(err, 'no err')
        t.equal(typeof archive, 'object', 'archive was created')
        t.ok(Buffer.isBuffer(archive.metadata.key), 'archive has a key')
      })
    })

    function createArchive (data, done) {
      var db = memdb()
      var drive = hyperdrive(db)
      var archive = drive.createArchive()
      done(null, archive)
    }
  })

  t.test('should recreate archives', function (t) {
    t.plan(4)
    var db = memdb()
    multidrive(db, createArchive, noop, function (err, drive) {
      t.ifError(err, 'no err')

      drive.create(null, function (err, archive) {
        t.ifError(err, 'no err')

        multidrive(db, createArchive, noop, function (err, drive) {
          t.ifError(err, 'no err')
          var drives = drive.list()
          t.equal(drives.length, 1, 'one drive on init')
        })
      })
    })

    function createArchive (data, done) {
      var db = memdb()
      var drive = hyperdrive(db)
      var archive = drive.createArchive()
      done(null, archive)
    }
  })
})

test('drive.list', function (t) {
  t.test('should list archives', function (t) {
    t.plan(3)

    var db = memdb()
    multidrive(db, createArchive, noop, function (err, drive) {
      t.ifError(err, 'no err')
      drive.create(null, function (err, archive) {
        t.ifError(err, 'no err')
        var drives = drive.list()
        t.equal(drives.length, 1, 'one drive')
      })
    })

    function createArchive (data, done) {
      var db = memdb()
      var drive = hyperdrive(db)
      var archive = drive.createArchive()
      done(null, archive)
    }
  })
})

test('drive.close', function (t) {
  t.test('close an archive', function () {
    t.plan(5)

    var db = memdb()
    multidrive(db, createArchive, closeArchive, function (err, drive) {
      t.ifError(err, 'no err')
      drive.create(null, function (err, archive) {
        t.ifError(err, 'no err')
        drive.close(archive.key, function (err) {
          t.ifError(err, 'no err')
          var drives = drive.list()
          t.equal(drives.length, 0, 'no drives left')
        })
      })
    })

    function createArchive (data, done) {
      var db = memdb()
      var drive = hyperdrive(db)
      var archive = drive.createArchive()
      done(null, archive)
    }

    function closeArchive (archive, done) {
      archive.close()
      done()
    }
  })
})
