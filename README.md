Mirex is a simple YouTube player based on MEAN stack (MongoDB, Exspress.js, AngularJS and Node.js). Mirex uses WebSocket technology allowing users to co-create playlist together. This is side project, which is still in the early stages of development.

## Installation

* Go to [official MongoDB website](https://www.mongodb.org/downloads). Follow the installation and configuration instructions.
* Clone or download repo to your computer.
* Open terminal and go to project directory.
* Install Node.js, which ships with npm.
* Install Browserify globally by `npm install -g browserify`.
* Install the rest of dependencies by `npm install`.
* Go to folder */public/scripts/* and run `browserify app.js -o app.min.js`.

Now your Mirex Player is almost ready to work. Check next section to see how to configure the player.

## Server configuration

* Open terminal and go to project directory.
* Start node server by `node server.js`. If server start correctly you should see *Listening on *:3000*.
* Open new terminal card and start MongoDB by `mongod`. If MongoDB start correctly you should see *[initandlisten] waiting for connections on port 27017*.
* Open new terminal card and run MongoDB by `mongo`.
* Create new database by `use mirexplayer`. If new database was created correctly you should see *switched to db mirexplayer*.

Now your Mirex Player is ready to use.

## Using

Mirex Player has two routes:

`http://localhost:3000/#/player` for user with player (only one user can control player). This user can start music, pause music and change player mode (repeat mode and shuffle mode). He can also do everything what normal user.

`http://localhost:3000/` for all other users who wants to co-create playlist.

## Contribute

If you would like to share your knowledge, please feel free to contribute. If you have suggestions for new features or find a bug, please use the [issue tracker](https://github.com/zacol/mirexplayer/issues). Any form of help will be appreciated.

## Development

This package is developed and maintained by
[Jacek Spławski](https://github.com/zacol) and [more contributors](https://github.com/zacol/mirexplayer/graphs/contributors).

## License

Please be aware of the licenses of each component we use in this project. Everything else that has been developed by the contributions to this project is
under [MIT License](LICENSE.md).
