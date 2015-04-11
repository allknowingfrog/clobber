var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var player = require('./player.js');

var sockets = {};
var socketPlayers = {};
var nextPlayer = 0;
var PLAYER_COUNT = 4;

var players = [];
for(var p=0; p<PLAYER_COUNT; p++) {
    players[p] = new player(p);
}

var map = require('./map.js').create(11, .6, players);

server.listen(3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
    socket.on('login', function(data, callback) {
        console.log('login attempt');
        if(data in sockets) {
            callback({
                success: false,
                msg: "Name is already taken"
            });
            console.log('login failed');
        } else if(data in socketPlayers) {
            socket.nickname = data;
            sockets[data] = socket;
            callback({
                success: true,
                player: socketPlayers[data].id,
                login: data,
                map: map.get()
            });
            console.log('login successful: '+data+" is player "+socketPlayers[data].id+" again");
        } else if(nextPlayer >= PLAYER_COUNT) {
            callback({
                success: false,
                msg: "Game is full"
            });
            console.log('login failed');
        } else if(data) {
            socket.nickname = data;
            sockets[data] = socket;
            socketPlayers[data] = players[nextPlayer];
            callback({
                success: true,
                player: nextPlayer,
                login: data,
                map: map.get()
            });
            console.log('login successful: '+data+" is player "+nextPlayer);
            nextPlayer++;
        } else {
            callback({
                success: false,
                msg: "Invalid login"
            });
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
        } else {
            return;
        }
    });
});
