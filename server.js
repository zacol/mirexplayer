var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongojs = require('mongojs');
var db = mongojs('mirexplayer', ['mirexplayer']);
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

//Socket.io
io.on('connection', function(socket) {
    io.sockets.emit('new user');

    socket.on('add song', function() {
        socket.broadcast.emit('get song list');
    });

    socket.on('remove song', function() {
        socket.broadcast.emit('get song list');
    });

    socket.on('set player info', function(data) {
        io.sockets.emit('get player info', data);
    });
});

//MongoDB
app.get('/songlist', function(req, res) {
    db.mirexplayer.find(function(err, docs) {
        res.json(docs);
    });
});

app.post('/songlist', function(req, res) {
    db.mirexplayer.insert(req.body, function(err, doc) {
        res.json(doc);
    });
});

app.put('/songlist/:id', function(req, res) {
    var id = req.params.id;
    db.mirexplayer.findAndModify({query: {_id: mongojs.ObjectId(id)},
        update: {$set: {plays: req.body.plays}},
        new: true }, function(err, doc) {
            res.json(doc);
        });
});

app.delete('/songlist/:id', function(req, res) {
    var id = req.params.id;
    db.mirexplayer.remove({_id: mongojs.ObjectId(id)}, function(err, doc) {
        res.json(doc);
    });
});

http.listen(3000, function(){
  console.log('Listening on *:3000');
});
