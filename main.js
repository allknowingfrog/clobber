// configs
var TILEW = 32; // must match slaySprites.png
var TILEH = 36; // must match slaySprites.png
var MAPSIZE = 19; // must be odd
var PLAYING = 6; // 2 to 6
var FILLRATIO = .6; // 0 to 1

// constants
var CELLS = (MAPSIZE * MAPSIZE) - (2 * (((MAPSIZE-1)/2) * ((((MAPSIZE-1)/2)+1)/2)));
var OUTPUTW = TILEW * 12;
var CANVASW = TILEW * (MAPSIZE+2) + OUTPUTW;
var CANVASH = TILEH * (MAPSIZE+2);
var ADJACENT = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];

var canvas;
var ctx;

var click = {x: -1, y: -1};

var tiles;
var map;

var island = [];
var players = [];

var active;

$(document).ready(function(){
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	canvas.width = CANVASW;
	canvas.height = CANVASH;

	canvas.style = "background-color:black";

	ctx.font = "30px Arial";
	ctx.fillStyle = "white";

	tiles = new Image();
	tiles.src = "clobberTiles.png";
	tiles.addEventListener("load", init, false);

	canvas.onclick = function(e) {
		var rect = canvas.getBoundingClientRect();
		click.x = e.clientX - rect.left;
		click.y = e.clientY - rect.top;
		input();
	}
});

function init() {
	buildPlayers();
	buildMap();
	fillMap();
	drawMap();
	drawOutput();
}

function input() {

}

function cellClick() {
	var x = Math.floor(click.x/TILEW) - 1;
	var y = Math.floor((click.y - ((Math.floor(MAPSIZE/2))*(TILEH/2)) + (x*(TILEH/2))) / TILEH) - 1;
	var result = [];
	result.push(x);
	result.push(y);
	return result;
}

function buildPlayers() {
	for (var i = 0; i <= PLAYING; i++) {
		players[i] = new player();
	}
}


function buildMap() {
	map = new Array(MAPSIZE);
	for (var i = 0; i < MAPSIZE; i++) {
		map[i] = new Array(MAPSIZE);
	}

	for (var y = 0; y < MAPSIZE; y++) {
		for (var x = 0; x < MAPSIZE; x++) {
			if (Math.abs(x-y) > MAPSIZE/2) {
				map[x][y] = -1;
			} else {
				// x coord, y coord, player, entity
				map[x][y] = new cell(x, y, 0, 0);
			}
		}
	}
}

function fillMap() {
	// x and y values to attempt to fill in map, starts in center
	var xTest = Math.floor(MAPSIZE/2);
	var yTest = Math.floor(MAPSIZE/2);

	// var for iterating through positions in island
	var isIt = 0;

	active = randNum(PLAYING + 1);
	var nextPlayer = false;
	var direction;

	// number of cells to fill
	var toFill = (CELLS * FILLRATIO) - ((CELLS * FILLRATIO) % (PLAYING*2));
	while (toFill > 0) {
		// move in a random direction
		direction = ADJACENT[randNum(6)];
		xTest += direction.x;
		yTest += direction.y;
		// if xTest and yTest are within the map boundaries...
		if (xTest >= 0 && xTest < MAPSIZE && yTest >= 0 && yTest < MAPSIZE && map[xTest][yTest] != -1) {
			// and if cell is available: claim, add to island, decrease toFill and move to next player
			if (map[xTest][yTest].player == 0) {
				map[xTest][yTest].player = active;
				island.push(map[xTest][yTest]);
				toFill--;
				if (nextPlayer) {
					active++;
				} else {
					nextPlayer = true;
				}
				if (active > PLAYING) {
					active = 1;
				}
			}
		}
		// move to newly claimed cell, or to beginning of list
		isIt++;
		if (isIt >= island.length) {
			isIt = 0;
		}
		xTest = island[isIt].x;
		yTest = island[isIt].y;
	}

	// organize regions
	var master;
	var search;
	var run;
	var adj = [];
	var test;
	var connected = [];
	for (var i = 0; i < island.length; i++) {
		master = island[i];
		if (master.region == -1 && !master.isolated()) {
			master.entity = 5;
			master.region = new region();
			players[master.player].regions.push(master.region);
			master.region.capital = master;
			master.region.cells.push(master);

			search = master;
			run = true;
			while (run) {
				adj = search.adjacent();
				for (var n = 0; n < adj.length; n++) {
					test = adj[n];
					if (test.player == master.player && test.region == -1) {
						test.region = master.region;
						master.region.cells.push(test);
						connected.push(test);
					}
				}
				if (connected.length == 0) {
					run = false;
				}
				search = connected.pop();
			}
		}
	}
}

function drawMap() {
	for (var y = 0; y < MAPSIZE+2; y++) {
		for (var x = 0; x < MAPSIZE+2; x++) {
			ctx.drawImage(tiles, 0, 0, TILEW, TILEH, x*TILEW, y*TILEH, TILEW, TILEH);
		}
	}
	for (var y = 0; y < MAPSIZE; y++) {
		for (var x = 0; x < MAPSIZE; x++) {
			if (map[x][y] == -1) {
				continue;
			} else {
				drawTile(x, y);
			}
		}
	}
}

function drawTile(x, y) {
	yDraw = ((Math.floor(MAPSIZE/2))*(TILEH/2)) + ((y+1)*TILEH) - (x*(TILEH/2));
	xDraw = (x+1)*TILEW;

	var p = map[x][y].player;
	var tile = map[x][y].entity;

	switch (tile) {
		case 0: // open
			ctx.drawImage(tiles, 0, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 1: // level 1 troop
			ctx.drawImage(tiles, TILEW, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 2: // level 2 troop
			ctx.drawImage(tiles, TILEW*2, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 3: // level 3 troop
			ctx.drawImage(tiles, TILEW*3, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 4: // level 4 troop
			ctx.drawImage(tiles, TILEW*4, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 5: // village
			ctx.drawImage(tiles, TILEW*5, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 6: // fort
			ctx.drawImage(tiles, TILEW*6, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 7: // grave
			ctx.drawImage(tiles, TILEW*7, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 8: // tree
			ctx.drawImage(tiles, TILEW*8, p*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
	}
}

function drawOutput() {
	var outLeft = CANVASW - (OUTPUTW - (2 * TILEW));
	var outTop = TILEH * 2;
	ctx.fillText("PLAYER " + active, outLeft, outTop);
}

function turn() {
	for (var n = 0; n < players[active].regions.length; n++) {
		players[active].regions[n].tax();
	}
}

function player() {
	this.regions = [];
}

function cell(x, y, player, entity) {
	this.x = x;
	this.y = y;
	this.player = player;
	this.entity = entity;
	this.region = -1;

	this.adjacent = adjacent;
	this.isolated = isolated;

	function adjacent() {
		var result = [];
		var neighbor;
		var xTest;
		var yTest;
		for (var i = 0; i < ADJACENT.length; i++) {
			xTest = this.x + ADJACENT[i].x;
			yTest = this.y + ADJACENT[i].y;
			if (xTest >= 0 && xTest < MAPSIZE && yTest >=0 && yTest < MAPSIZE) {
				neighbor = map[xTest][yTest];
				if (neighbor != -1) {
					result.push(neighbor);
				}
			}
		}
		return result;
	}

	function isolated() {
		var neighbors = this.adjacent();
		for (var i = 0; i < neighbors.length; i++) {
			if (neighbors[i].player == this.player) {
				return false;
			}
		}
		return true;
	}
}

function region() {
	this.capital = -1;
	this.cells = [];
	this.bank = 0;

	this.tax = tax;
	function tax() {
		this.bank += this.cells.length;
	}
}

// returns a random integer from 0 to ints - 1
function randNum(ints) {
	return Math.floor((Math.random()*ints));
}
