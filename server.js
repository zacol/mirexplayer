// var express = require('express');
// var app = express();

var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongojs = require('mongojs');
var db = mongojs('contactlist', ['contactlist']);
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

//Socket.io
io.on('connection', function(socket) {
    console.log('A user connected');

    socket.on('disconnect', function() {
        console.log('A user disconnected');
    });

    socket.on('add song', function() {
        socket.broadcast.emit('get song list');
    });

    socket.on('remove song', function() {
        socket.broadcast.emit('get song list');
    });
});

//MongoDB
app.get('/songlist', function(req, res) {
    db.contactlist.find(function(err, docs) {
        res.json(docs);
    });
});

app.post('/songlist', function(req, res) {
    db.contactlist.insert(req.body, function(err, doc) {
        res.json(doc);
    });
});

app.delete('/songlist/:id', function(req, res) {
    var id = req.params.id;
    db.contactlist.remove({_id: mongojs.ObjectId(id)}, function(err, doc) {
        res.json(doc);
    })
});

http.listen(3000, function(){
  console.log('Listening on *:3000');
});
