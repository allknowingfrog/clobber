//init
var cell = require('./cell').cell;
var player = require('./player').player;
var region = require('./region').region;

var players = [];
var pCount = 2;
var adjacent = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];
var playing = false;
var active = null;
var activeIt = 0;
var gameTurn = 1;
var playerCells = [];
var entityCells = [];
var regNum = 0;

var map = {
    size: 11,
    fill: .6,
    cells: null,
    cellCount: 0,
    island: [],
    selected: null
};
map.cellCount = (map.size * map.size) - (2 * (((map.size-1)/2) * ((((map.size-1)/2)+1)/2)));

// if given coord lies inside the playable map area, return true, otherwise false
map.inBounds = function(x, y) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
        return true;
    } else {
        return false;
    }
};

// build map
map.cells = new Array(map.size);
(function(){
    // build 2D array
    for (var i = 0; i < map.size; i++) {
        map.cells[i] = new Array(map.size);
    }

    // assign cells to players
    // x and y values to attempt to fill in map, starts in center
    var xTest = Math.floor(map.size/2);
    var yTest = Math.floor(map.size/2);

    // var for iterating through positions in island
    var isIt = 0;

    var nextPlayer = false;
    var direction;
    // number of cells to fill
    var toFill = (map.cellCount * map.fill) - ((map.cellCount * map.fill) % (pCount*2));
    while (toFill > 0) {
        // move in a random direction
        direction = adjacent[randNum(adjacent.length)];
        xTest += direction.x;
        yTest += direction.y;
        // if in-bounds and cell available: claim, add to island, decrease toFill and move to next player
        if (map.inBounds(xTest, yTest) && !map.cells[xTest][yTest]) {
            map.cells[xTest][yTest] = new cell(x, y);
            map.cells[xTest][yTest].player = players[activeIt];
            map.island.push(map.cells[xTest][yTest]);
            toFill--;
            if (nextPlayer) {
                activeIt++;
            } else {
                nextPlayer = true;
            }
            if (activeIt >= pCount) {
                activeIt = 0;
            }
        }
        // move to newly claimed cell, or to beginning of list
        isIt++;
        if (isIt >= map.island.length) {
            isIt = 0;
        }
        xTest = map.island[isIt].x;
        yTest = map.island[isIt].y;
    }

    // assign cells to regions
    var test;
    for (var i=0; i < map.island.length; i++) {
        test = map.island[i];
        if (!test.region && !test.isolated()) {
            test.player.regions.push(new region(regNum++, test, 10));
            test.region.addConnected();
        }
    }
})();

// return a random integer from zero to ints-1
function randNum(ints) {
    return Math.floor((Math.random()*ints));
}

// move to next player, various updates
function newTurn() {
    activeIt++;
    if (activeIt >= pCount) {
        gameTurn++;
        activeIt = 0;
    }
    active = players[activeIt];
    //active.update();
    /*if (active.regions.length <= 0) {
        for (var i = players.length-1; i >= 0; i--) {
            if (players[i] == active) {
                players.splice(i, 1);
                pCount--;
            }
        }
        activeIt--;
        newTurn();
    }*/
    active.socket.emit('beginTurn');
}

//server
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000, function(){
    console.log('listening on 3000');
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    if(!playing && players.length < pCount) {
        var index = players.length;
        players[index] = new player(index, socket);
        socket.emit('message', 'Successfully joined');
        if(players.length == pCount) {
            playing = true;
            io.emit('message', 'Starting game');
            active = players[activeIt];
            active.socket.emit('beginTurn');
        }
    } else {
        socket.emit('message', 'Unable to join');
    }
    socket.on('endTurn', function(){
        newTurn();
    });
    socket.on('order', function(order){
       io.emit('message', order); 
    });
    socket.on('disconnect', function(){
        if(!playing) {
            for (i in players) {
                if(players[i].socket = socket) {
                    players.splice(i, 1);
                    break;
                }
            }
        } else if(players[activeIt].socket == socket) {
            newTurn();
        }
    });
});

