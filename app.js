var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var player = require('./player.js');
var player = require('./cell.js');

//globals
users = {};
players = {};

MAP_SIZE = 11;

dirs = {
    nw:   {x: -1,  y: -1},
    n:    {x:  0,  y: -1},
    ne:   {x:  1,  y:  0},
    se:   {x:  1,  y:  1},
    s:    {x:  0,  y:  1},
    sw:   {x: -1,  y:  0},
    here: {x:  0,  y:  0}
};

map = [];
for(var x=0; x<MAP_SIZE; x++) {
    map[x] = [];
    for(var y=0; y<MAP_SIZE; y++) {
        map[x][y] = new cell(x, y);
    }
}

server.listen(3000);

app.use(express.static(__dirname + '/sprites'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
    socket.on('login', function(data, callback) {
        if(data in users) {
            callback(false);
        } else if(data) {
            socket.nickname = data;
            users[socket.nickname] = socket;
            players[socket.nickname] = new player(socket.nickname);
            callback({
                login: data
            });
        } else {
            callback(false);
        }
    });
    socket.on('move', function(data) {
        players[socket.nickname].move(data);
        io.sockets.emit('update'); //send map
    });
    socket.on('turn', function(data) {
        io.sockets.emit('turn'); //next turn
    });
    socket.on('disconnect', function(data) {
        if(socket.nickname) {
            delete users[socket.nickname];
            delete players[socket.nickname];
        } else {
            return;
        }
    });
});
