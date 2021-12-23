[![deprecated](http://badges.github.io/stability-badges/dist/deprecated.svg)](https://dat-ecosystem.org/) 

More info on active projects and modules at [dat-ecosystem.org](https://dat-ecosystem.org/) <img src="https://i.imgur.com/qZWlO1y.jpg" width="30" height="30" /> 

---

# multidrive [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![Test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

Manage multiple hyperdrive archives located anywhere on the filesystem.

## Usage
```js
var hyperdrive = require('hyperdrive')
var multidrive = require('multidrive')
var toilet = require('toiletdb')

var store = toilet('./data.json')
multidrive(store, createArchive, closeArchive, function (err, drive) {
  if (err) throw err

  var data = { key: '<64-bit-hex>' }
  drive.create(data, function (err, archive) {
    if (err) throw err

    var archives = drive.list()
    console.log(archives)

    drive.close(archive.key, function (err) {
      if (err) throw err
      console.log('archive deleted')
    })
  })
})

function createArchive (data, done) {
  var db = level('/tmp/' + 'multidrive-' + data.key)
  var drive = hyperdrive(db)
  var archive = drive.createArchive(data.key)
  done(null, archive)
}

function closeArchive (archive, done) {
  archive.close()
  done()
}
```

## Error handling
If there is an error initializing a drive, instead of the whole process failing, an error object with attached `.data` property will be pushed into the list of archives instead. That means when consuming multidrive.list(), you should check for errors:

```js
var archives = multidrive.list()
archives.forEach(function (archive) {
  if (archive instanceof Error) {
    var err = archive
    console.log('failed to initialize archive with %j: %s', err.data, err.message)
  }
})
```

This way you can decide for yourself whether an individual initialization failure should cause the whole process to fail or not.

## API
### multidrive(store, createArchive, closeArchive, callback(err, drive))
Create a new multidrive instance. `db` should be a valid `toiletdb` instance.
`createArchive` is the function used to create new Hyperdrive archives.
`callback` is called after initialization. `closeArchive` is called when
`drive.remove()` is called.

`createArchive` has an api of `createArchive(data, done)` where `data` is passed in
by `drive.create()` and `done(err, archive)` expects a valid archive.

`closeArchive` has an api of `closeArchive(archive, done)` where `archive` was
created by `createArchive` and `done(err)` is expected to be called when the
archive has been properly closed. `closeArchive` is called when a specific
archive is closed through `.close` or when through `.disconnect` all archives get
disconnected.

### archives = drive.list()
List all `archives` in the `multidrive`.

### drive.create(data, callback(err, drive[, duplicate]))
Create a new Hyperdrive archive. `data` is passed into `createArchive`.
If an archive with the same key already exists, returns that instead and sets
`duplicate` to `true`.

### drive.close(key, callback(err))
Remove an archive by its public key. Calls `closeArchive()`

### drive.disconnect(callback(err))
Disconnects the drive from the store and closes all archives (without removing them).

## Installation
```sh
$ npm install multidrive
```

## See Also
- https://github.com/karissa/hyperdiscovery
- https://github.com/mafintosh/hyperdrive
- https://github.com/Level/level
- https://github.com/maxogden/toiletdb

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/multidrive.svg?style=flat-square
[3]: https://npmjs.org/package/multidrive
[4]: https://img.shields.io/travis/datproject/multidrive/master.svg?style=flat-square
[5]: https://travis-ci.org/datproject/multidrive
[6]: https://img.shields.io/codecov/c/github/datproject/multidrive/master.svg?style=flat-square
[7]: https://codecov.io/github/datproject/multidrive
[8]: http://img.shields.io/npm/dm/multidrive.svg?style=flat-square
[9]: https://npmjs.org/package/multidrive
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
