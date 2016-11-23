# multidrive [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Manage multiple hyperdrive archives located anywhere on the filesystem.

## Usage
```js
var discovery = require('hyperdiscovery')
var raf = require('random-access-file')
var multidrive = require('multidrive')
var path = require('path')

multidrive('my-cool-drive', function (err, drive) {
  if (err) console.error(err)

  drive.createArchive(process.cwd(), function (err, archive) {
    if (err) return console.error(err)

    // archive === [HyperDriveArchive]
    drive.list(function (err, archives) {
      if (err) console.error(err)

      // archives === { '/usr/tiny-cat/drives': [HyperDriveArchive] }
      Object.keys(archives).forEach(function (key) {
        var archive = archives[key]
        discovery(archive)
      })
    })
  })
})
```

To replicate an existing archive pass in a key to `drive.createArchive` as
`opts.key`:
```js
var multidrive = require('multidrive')

multidrive('my-cool-archive', function (err, drive) {
  if (err) console.error(err)

  var key = '<64 bit hex string>'
  drive.createArchive(process.cwd(), { key: key }, function (err, archive) {
    if (err) return console.error(err)
    console.log(archive)
  })
})
```

## API
### multidrive(name, [opts], callback(err, drive))
Create a new `multidrive` instance. The `level` database used to store
multidrive metadata is stored under `~/.level/<drivename>`. Each drive on the
system is stateful and must have a unique name to prevent conflicts.

`opts` is an options object that is passed to each `hyperdrive.createArchive`
call internally. `opts` can have the following values:
```js
{
  live: false, // set this to share archives without finalizing them
  sparse: false, // set this to only download the pieces of the feeds you are requesting / prioritizing
  file: function (name) {
    // set this to determine how file data is stored.
    // the storage instance should implement the hypercore storage api
    // https://github.com/mafintosh/hypercore#storage-api
    return someStorageInstance
  }
}
```

### drive.list(callback(err, drives))
List all `archives` in the `multidrive`. `drives` is a key-value object where
keys are file paths, and values are hyperdrive archives.

### drive.createArchive(location, [opts], callback(err, drive))
Create a new named `hyperdrive` under `location`. To replicate an existing
drive pass in `opts.key`. `opts.key` and `opts.secretKey` (for archives with
write access only) are stored on the filesystem in the drive `locations` as
`KEY` and `SECRET_KEY` respectively.

`opts` is an options object that is passed to each `hyperdrive.createArchive`
call internally. These options take priority over the options passed into
`drive()`. opts` can have the following values:
```js
{
  live: false, // set this to share the archive without finalizing it
  sparse: false, // set this to only download the pieces of the feed you are requesting / prioritizing
  key: '<64 bit hex string>' // set this to replicate an archive
}
```

### drive.removeArchive(location, callback(err))
Delete a named `hyperdrive` from the `multidrive` instance. __Does not delete
any files on disk__, only the archive that's stored in `multidrive`. To delete
an `archive` on disk, remove the path at `archive.location`.

## FAQ
### How is multidrive different from hyperdrive?
Hyperdrive is a stateless library intended to manage a single archive. It
doesn't persist public / private keys, and needs to be passed an `level`
database to save its data.

Multidrive is a stateful library intended to manage multiple archives. It
persists public / private keys and creates `level` databases on the filesystem
to store data.

### How can I get the location of an archive?
Each `archive` exposes a `.location` property which is the location where
the drive is currently stored.

## Installation
```sh
$ npm install multidrive
```

## See Also
- https://github.com/karissa/hyperdrive-archive-swarm
- https://github.com/mafintosh/hyperdrive

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
