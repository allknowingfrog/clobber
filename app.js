var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var player = require('./player.js');

//globals
sockets = {};
socketPlayers = {};
nextPlayer = 0;
nextRegion = 0;

PLAYER_COUNT = 4;
players = [];
for(var p=0; p<PLAYER_COUNT; p++) {
    players[p] = new player(p);
}

adjacent = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];

map = {};
require('./map.js').create(map, 11, .6, players);

server.listen(3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
    socket.on('login', function(data, callback) {
        console.log('login attempt');
        if(data in sockets) {
            callback(false);
            console.log('login failed');
        } else if(data) {
            socket.nickname = data;
            sockets[socket.nickname] = socket;
            socketPlayers[socket.nickname] = players[nextPlayer];
            nextPlayer++;
            callback({
                login: data,
                map: map.get()
            });
            console.log('login successful: '+data);
        } else {
            callback(false);
            console.log('login failed');
        }
    });
    socket.on('move', function(data) {
        socketPlayers[socket.nickname].move(data);
        io.sockets.emit('update'); //send map
    });
    socket.on('turn', function(data) {
        io.sockets.emit('turn'); //next turn
    });
    socket.on('disconnect', function(data) {
        if(socket.nickname) {
            delete sockets[socket.nickname];
            socketPlayers[socket.nickname] = null;
        } else {
            return;
        }
    });
});
