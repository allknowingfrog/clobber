var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var users = [];
var maxUsers = 2;
var playing = false;
var active = null;

server.listen(3000, function(){
    console.log('listening on 3000');
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    if(!playing && users.length < maxUsers) {
        users[users.length] = socket;
        socket.emit('message', 'Successfully joined');
        if(users.length == maxUsers) {
            playing = true;
            io.emit('message', 'Starting game');
            active = users[0];
            active.emit('beginTurn');
        }
    } else {
        socket.emit('message', 'Unable to join');
    }
    socket.on('endTurn', function(){
        var userIndex = users.indexOf(socket);
        if(userIndex < users.length - 1) {
            userIndex++;
        } else {
            userIndex = 0;
        }
        active = users[userIndex];
        active.emit('beginTurn');
    });
    socket.on('disconnect', function(){
        users.splice(users.indexOf(socket), 1);
    });
});

