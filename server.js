var express = require('express');
var app = express();

var mongojs = require('mongojs');
var db = mongojs('contactlist', ['contactlist']);

var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

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

app.listen(3000);
console.log('Server running on port 3000');
