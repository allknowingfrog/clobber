/* all functions and variables belong to one of the following global objects */

// (number of players)
var core = new coreObj(6);

// (map size, fill ratio)
var map = new mapObj(19, .6);

// (output width)
var output = new outputObj(12);

var canvas;

var ctx;

// (tile width, tile height)
var tile = new tileObj(32, 36);

for (var i = 0; i <= core.pCount; i++) {
	core.players[i] = new player();
	core.players[i].id = i;
}

map.cellCount = (map.size * map.size) - (2 * (((map.size-1)/2) * ((((map.size-1)/2)+1)/2)));

output.left = map.size + 3;

$(document).ready(function() {

	canvas = document.getElementById("canvas");

	ctx = canvas.getContext("2d");

	canvas.width = tile.w * (map.size + 2 + output.w);
	canvas.height = tile.h * (map.size + 2);

	canvas.style = "background-color:black";

	// convert mouse clicks to canvas coords and call input function
	canvas.onclick = function(e) {
		var rect = canvas.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		core.input(x, y);
	}

	ctx.font = core.fontSize + "px Arial";
	ctx.fillStyle = "white";

	// load sprites, then start game
	tile.img = new Image();
	tile.img.src = "clobberTiles.png";
	tile.img.onload=core.game();
});
