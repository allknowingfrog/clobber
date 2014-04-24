var	pCount = 6;
var humans = 1;
var	players = [];
var	adjacent = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];
var active;
var	activeIt = 1;
var	gameTurn = 1;
var	fontSize = 24;
var regNum = 0;

for (var i = 0; i <= pCount; i++) {
	if (i <= humans) {
		players[i] = new player(i, false);
	} else {
		players[i] = new player(i, true);
	}
}

// return a random integer from zero to ints-1
function randNum(ints) {
	return Math.floor((Math.random()*ints));
}

// move to next player, various updates, execute computer turns
function newTurn() {
	map.selected = null;
	activeIt++;
	if (activeIt > pCount) {
		gameTurn++;
		activeIt = 1;
	}
	active = players[activeIt];
	active.update();
	if (active.regions.length <= 0) {
		for (var i = players.length-1; i >= 0; i--) {
			if (players[i] == active) {
				players.splice(i, 1);
				pCount--;
			}
		}
		activeIt--;
		newTurn();
	}
	draw();
	if (active.computer) {
		computerTurn();
	}
}

function computerTurn() {
	var regions = active.regions;
	var troops = active.troops;
	var cells;
	var village;
	var test;
	var adj;
	var target;
	for (var i = 0; i < regions.length; i++) {
		cells = regions[i].cells;
		troops = regions[i].troops;
		village = regions[i].capital.entity;
		for (var n = 0; n < cells.length; n++) {
			test = cells[n];
			if (village.bank >= 10) {
				if (!test.entity) {
					test.buyTroop();
				}
			} else {
				break;
			}
		}
	}
	for (var i = 0; i < troops.length; i++) {
		test = troops[i].cell;
		adj = test.findAdj();
		(function(){
			for (var z = 0; z < cells.length; z++) {
				adj = cells[z].findAdj();
				for (var n = 0; n < adj.length; n++) {
					target = adj[n];
					if (target.player != active.player) {
						if (test.moveTroop(target)) {
							return;
						}
					}
				}
			}
		})();
	}
	newTurn();
}

var tile = {
	w: 32,
	h: 36
};
tile.img = new Image();
tile.img.src = "clobberTiles.png";

var map = {
	size: 19,
	fill: .6,
	cells: null,
	cellCount: 0,
	island: [],
	selected: null
};
map.cellCount = (map.size * map.size) - (2 * (((map.size-1)/2) * ((((map.size-1)/2)+1)/2)));
map.cells = new Array(map.size);

// if given coord lies inside the playable map area, return true, otherwise false
map.inBounds = function(x, y) {
	if (x >= 0 && x < this.size && y >= 0 && y < this.size && this.cells[x][y]) {
		return true;
	} else {
		return false;
	}
};

// convert locations in map.cells array to output hexagons on the map
map.sqToHex = function(x, y) {
	var result = [];
	y = (Math.floor(this.size/2)*.5) + (y+1) - (x*.5);
	x = (x+1);
	result.push(x);
	result.push(y);
	return result;
};

// build map
(function(){
	// build 2D array
	for (var i = 0; i < map.size; i++) {
		map.cells[i] = new Array(map.size);
	}

	// assign cell objects to cells array
	for (var y = 0; y < map.size; y++) {
		for (var x = 0; x < map.size; x++) {
			if (Math.abs(x-y) > map.size/2) {
				map.cells[x][y] = null;
			} else {
				// x coord, y coord
				map.cells[x][y] = new cell(x, y);
				map.cells[x][y].player = players[0];
			}
		}
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
		if (map.inBounds(xTest, yTest) && map.cells[xTest][yTest].player.id == 0) {
			map.cells[xTest][yTest].player = players[activeIt];
			map.island.push(map.cells[xTest][yTest]);
			toFill--;
			if (nextPlayer) {
				activeIt++;
			} else {
				nextPlayer = true;
			}
			if (activeIt > pCount) {
				activeIt = 1;
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
	for (var i = 0; i < map.island.length; i++) {
		test = map.island[i];
		if (!test.region && !test.isolated()) {
			test.player.regions.push(new region(regNum++, test, 10));
			test.region.addConnected();
		}
	}
})();

var output = {
	w: 12,
	top: 2
};
output.left = map.size + 3;

var canvas;

var ctx;
