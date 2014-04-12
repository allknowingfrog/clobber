$(document).ready(function() {
	// (number of players)
	var core = new coreObj(6);

	// (map size, fill ratio)
	var map = new mapObj(19, .6);

	// (output width)
	var output = new outputObj(12);

	// (canvas id from index.html)
	var canvas = document.getElementById("canvas");

	// (perspective)
	var ctx = canvas.getContext("2d");

	// (tile width, tile height)
	var tile = new tileObj(32, 36);


	for (var i = 0; i <= core.pCount; i++) {
		core.players[i] = new player();
	}

	map.cellCount = (map.size * map.size) - (2 * (((map.size-1)/2) * ((((map.size-1)/2)+1)/2)));

	output.left = map.size + 3;

	canvas.width = tile.w * (map.size + 2 + output.w);
	canvas.height = tile.h * (map.size + 2);

	canvas.style = "background-color:black";

	canvas.onclick = function(e) {
		var rect = canvas.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		core.input(map, output, ctx, tile, x, y);
	}

	ctx.font = "24px Arial";
	ctx.fillStyle = "white";

	tile.img = new Image();
	tile.img.src = "clobberTiles.png";
	tile.img.onload(core.game(map, output, canvas, ctx, tile));
});
