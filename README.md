# multidrive [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Manage multiple hyperdrives. Stores `hyperdrive` databases in a location that's
passed in on creation.

## Usage
```js
const discovery = require('hyperdiscovery')
const multidrive = require('multidrive')

const manager = multidrive('my-cool-archive', function (err) {
  if (err) console.error(err)
})

const driveLocation = process.cwd()
manager.create('cute-cats', driveLocation, (err, drive) => {
  if (err) return console.error(err)

  // drive === [HyperDrive]
  manager.list((err, drives) => {
    if (err) console.error(err)

    // drives === { 'cute-cats': [HyperDrive] }
    Object.keys(drives).forEach((key) => {
      const drive = drives[key]
      const archive = drive.createArchive()
      discovery(archive)
    })
  })
})
```

## API
### manager = multidrive(name, callback)
Create a new `multidrive` instance

### manager.list(callback(err, drives))
List all drives in the `multidrive`. `drives` is a key-value object where keys
are names, and values are hyperdrive instances

### manager.create(name, location, callback(err, drive))
Create a new named `hyperdrive` under `location`

### manager.delete(name, callback(err))
Delete a named `hyperdrive` from the `multidrive` instance. __Does not delete
any files on disk__, only the record that's part of `multidrive`.

## Installation
```sh
$ npm install multidrive
```

## See Also
- https://github.com/karissa/hyperdrive-archive-swarm
- https://github.com/mafintosh/hyperdrive
- https://github.com/yoshuawuyts/centralized-multidrive

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
