# multidrive [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![Test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

Manage multiple hyperdrive archives located anywhere on the filesystem.

## Usage
```js
var hyperdrive = require('hyperdrive')
var multidrive = require('multidrive')
var level = require('level')

var db = level('/tmp/archives')
multidrive(db, createArchive, closeArchive, function (err, drive) {
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

## API
### multidrive(db, createArchive, closeArchive, callback(err, drive))
Create a new multidrive instance. `db` should be a valid `level` instance.
`createArchive` is the function used to create new Hyperdrive archives.
`callback` is called after initialization. `closeArchive` is called when
`drive.remove()` is called.

`createArchive` has an api of `createArchive(data, done)` where `data` is passed in
by `drive.create()` and `done(err, archive)` expects a valid archive.

### archives = drive.list()
List all `archives` in the `multidrive`.

### drive.create(data, callback(err, drive))
Create a new Hyperdrive archive. `data` is passed into `createArchive`.

### drive.close(key, callback(err))
Remove an archive by its public key. Calls `closeArchive()`

## Installation
```sh
$ npm install multidrive
```

## See Also
- https://github.com/karissa/hyperdiscovery
- https://github.com/mafintosh/hyperdrive
- https://github.com/Level/level

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/multidrive.svg?style=flat-square
[3]: https://npmjs.org/package/multidrive
[4]: https://img.shields.io/travis/yoshuawuyts/multidrive/master.svg?style=flat-square
[5]: https://travis-ci.org/yoshuawuyts/multidrive
[6]: https://img.shields.io/codecov/c/github/yoshuawuyts/multidrive/master.svg?style=flat-square
[7]: https://codecov.io/github/yoshuawuyts/multidrive
[8]: http://img.shields.io/npm/dm/multidrive.svg?style=flat-square
[9]: https://npmjs.org/package/multidrive
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
