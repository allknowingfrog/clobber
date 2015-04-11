var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var player = require('./player.js');

var sockets = {};
var socketPlayers = {};
var activePlayer = 0;
var PLAYER_COUNT = 2;
var turn = 0;

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
                turn: turn,
                map: map.get()
            });
            console.log('login successful: '+data+" returns as player "+socketPlayers[data].id);
        } else if(turn > 0) {
            callback({
                success: false,
                msg: "Game is full"
            });
            console.log('login failed');
        } else if(data) {
            socket.nickname = data;
            sockets[data] = socket;
            socketPlayers[data] = players[activePlayer];
            callback({
                success: true,
                player: activePlayer,
                login: data,
                turn: turn,
                map: map.get()
            });
            console.log('login successful: '+data+" is player "+activePlayer);
            activePlayer++;
            if(activePlayer >= PLAYER_COUNT) {
                newTurn();
                update();
                console.log('beginning game');
            }
        } else {
            callback({
                success: false,
                msg: "Invalid login"
            });
            console.log('login failed');
        }
    });
    socket.on('move', function(data) {
        console.log(socket.nickname+' moves a troop');
        var from = map.cells[data.from.x][data.from.y];
        if(from.player == socketPlayers[socket.nickname]) {
            from.moveTroop(map.cells[data.to.x][data.to.y]);
        }
        update();
    });
    socket.on('troop', function(data) {
        console.log(socket.nickname+' buys a troop');
        var target = map.cells[data.x][data.y];
        if(target.player == socketPlayers[socket.nickname]) target.buyTroop();
        update();
    });
    socket.on('tower', function(data) {
        console.log(socket.nickname+' moves a tower');
        var target = map.cells[data.x][data.y];
        if(target.player == socketPlayers[socket.nickname]) target.buyTower();
        update();
    });
    socket.on('turn', function(data) {
        newTurn();
        update();
    });
    socket.on('disconnect', function(data) {
        if(socket.nickname) {
            delete sockets[socket.nickname];
        } else {
            return;
        }
    });
});

function update() {
    io.sockets.emit('update', {
        map: map.get(),
        turn: turn,
        activePlayer: activePlayer
    });
}

// move to next player, various updates, execute computer turns
function newTurn() {
	activePlayer++;
	if(activePlayer >= PLAYER_COUNT) {
		turn++;
        activePlayer = 0;
	}

	var active = players[activePlayer];
	active.update();
	if(active.regions.length <= 0) {
		active.alive = false;
	}

    if(!active.alive) {
        newTurn();
    }
}
