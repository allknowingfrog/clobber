// core is a global object, coreObj() should only be used to create var core
function coreObj(pCount) {
	this.pCount = pCount;
	this.players = [];
	this.adj = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];
	this.active = 1;
	this.turn = 0;
	this.fontSize = 24;

	this.game = game;
	this.startTurn = startTurn;
	this.endTurn = endTurn;
	this.input = input;
	this.draw = draw;
	this.randNum = randNum;

	// execute once to start the game
	function game() {
		map.build();
		map.claim();
		map.regions();
		this.draw();
		this.startTurn();
	}

	// start a new turn
	function startTurn() {
		this.players[this.active].update();
	}

	// advance counters to next player and call startTurn()
	function endTurn() {
		map.selected = null;
		this.active++;
		if (this.active > this.pCount) {
			this.active = 1;
		}
		this.turn++;
		this.startTurn();
	}

	// convert mouse clicks into appropriate actions
	function input(x, y) {
		if (x < (map.size+1) * tile.w) {
			x = Math.floor(x/tile.w) - 1;
			y = Math.floor((y - ((Math.floor(map.size/2))*(tile.h/2)) + (x*(tile.h/2))) / tile.h) - 1;
			var test = map.cells[x][y];
			/*if (test.region) {
				$("#output").append(test.region.capital.x + ", " + test.region.capital.y + "; ");
			}*/
			if (map.selected && map.selected.entity && map.selected.entity.id == "troop") {
				map.selected.attack(test);
			} else if (test.player.id == this.active) {
				map.selected = map.cells[x][y];
			} else if (!test || test.player.id == 0) {
				map.selected = null;
			}
		} else if (x >= output.left * tile.w && x < (output.left + 1) * tile.w && y >= output.top * tile.w && y < (output.top + 1) * tile.h) {
			this.endTurn();
		} else if (x >= (output.left + 1) * tile.w && x < (output.left + 2) * tile.w && y >= (output.top + 3) * tile.w && y < (output.top + 4) * tile.h) {
			map.selected.buyTroop();
		} else if (x >= (output.left + 2) * tile.w && x < (output.left + 3) * tile.w && y >= (output.top + 3) * tile.w && y < (output.top + 4) * tile.h) {
			map.selected.buyTower();
		}
		this.draw();
	}

	// update both the map and the output sidebar
	function draw() {
		map.draw();
		output.draw();
	}

	// return a random integer from zero to ints-1
	function randNum(ints) {
		return Math.floor((Math.random()*ints));
	}
}
