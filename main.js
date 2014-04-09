// configs
var TILEW = 32; // must match slaySprites.png
var TILEH = 36; // must match slaySprites.png
var MAPSIZE = 19; // must be odd
var PLAYERS = 6; // 2 to 6
var FILLRATIO = .6; // 0 to 1

// constants
var CELLS = (MAPSIZE * MAPSIZE) - (2 * (((MAPSIZE-1)/2) * ((((MAPSIZE-1)/2)+1)/2)));
var CANVASW = TILEW * (MAPSIZE+2);
var CANVASH = TILEH * (MAPSIZE+2);
var ADJACENT = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];

var canvas;
var ctx;

var click = {x: -1, y: -1};

var tiles;
var map;

$(document).ready(function(){
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	canvas.width = CANVASW;
	canvas.height = CANVASH;

	canvas.style = "background-color:black";

	canvas.onclick = function(e) {
		var rect = canvas.getBoundingClientRect();
		click.x = e.clientX - rect.left;
		click.y = e.clientY - rect.top;
		cellClick();
	}

	tiles = new Image();
	tiles.src = "clobberTiles.png";
	tiles.addEventListener("load", init, false);
});

function init() {
	buildMap();
	fillMap();
	drawMap();
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

	var player = map[x][y].player;
	var tile = map[x][y].entity;

	switch (tile) {
		case 0: // open
			ctx.drawImage(tiles, 0, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 1: // level 1 troop
			ctx.drawImage(tiles, TILEW, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 2: // level 2 troop
			ctx.drawImage(tiles, TILEW*2, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 3: // level 3 troop
			ctx.drawImage(tiles, TILEW*3, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 4: // level 4 troop
			ctx.drawImage(tiles, TILEW*4, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 5: // village
			ctx.drawImage(tiles, TILEW*5, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 6: // fort
			ctx.drawImage(tiles, TILEW*6, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 7: // grave
			ctx.drawImage(tiles, TILEW*7, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
		case 8: // tree
			ctx.drawImage(tiles, TILEW*8, player*TILEH, TILEW, TILEH, xDraw, yDraw, TILEW, TILEH);
			break;
	}
}

function cell(x, y, player, entity, village) {
	this.x = x;
	this.y = y;
	this.player = player;
	this.entity = entity;
	this.village = village;

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

function cellClick() {
	var x = Math.floor(click.x/TILEW) - 1;
	var y = Math.floor((click.y - ((Math.floor(MAPSIZE/2))*(TILEH/2)) + (x*(TILEH/2))) / TILEH) - 1;
	var result = [];
	result.push(x);
	result.push(y);
	return result;
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
				// x coord, y coord, player, entity, village object
				map[x][y] = new cell(x, y, 0, 0, {x: -1, y: -1});
			}
		}
	}
}

function fillMap() {
	// x and y values to attempt to fill in map, starts in center
	var xTest = Math.floor(MAPSIZE/2);
	var yTest = Math.floor(MAPSIZE/2);

	// filled = list of owned cells, filledTest = position in filled
	var filled = [];
	var filledTest = 0;

	var player = randNum(PLAYERS + 1);
	var nextPlayer = false;
	var direction;

	// number of cells to fill
	var toFill = (CELLS * FILLRATIO) - ((CELLS * FILLRATIO) % (PLAYERS*2));
	while (toFill > 0) {
		// move in a random direction
		direction = ADJACENT[randNum(6)];
		xTest += direction.x;
		yTest += direction.y;
		// if xTest and yTest are within the map boundaries...
		if (xTest >= 0 && xTest < MAPSIZE && yTest >= 0 && yTest < MAPSIZE && map[xTest][yTest] != -1) {
			// and if cell is available: claim, add to filled, decrease toFill and move to next player
			if (map[xTest][yTest].player == 0) {
				map[xTest][yTest].player = player;
				filled.push(map[xTest][yTest]);
				toFill--;
				if (nextPlayer) {
					player++;
				} else {
					nextPlayer = true;
				}
				if (player > PLAYERS) {
					player = 1;
				}
			}
		}
		// move to newly claimed cell, or to beginning of list
		filledTest++;
		if (filledTest >= filled.length) {
			filledTest = 0;
		}
		xTest = filled[filledTest].x;
		yTest = filled[filledTest].y;
	}

	// add villages
	var adj = [];
	var connected = [];
	var test;
	var run;
	for (var i = 0; i < filled.length; i++) {
		if (filled[i].village.x == -1 && !filled[i].isolated()) {
			filled[i].entity = 5;
			filled[i].village.x = filled[i].x;
			filled[i].village.y = filled[i].y;
			test = filled[i];
			run = true;
			while (run) {
				adj = test.adjacent();
				for (var n = 0; n < adj.length; n++) {
					if (adj[n].player == filled[i].player && adj[n].village.x == -1) {
						adj[n].village.x = filled[i].x;
						adj[n].village.y = filled[i].y;
						connected.push(adj[n]);
					}
				}
				if (connected.length == 0) {
					run = false;
				}
				test = connected.pop();
			}
		}
	}
}

// returns a random integer from 0 to ints - 1
function randNum(ints) {
	return Math.floor((Math.random()*ints));
}
