// map is a global object, mapObj() should only be used to create var map
function mapObj(size, fill) {
	this.size = size;
	this.fill = fill;
	this.cells;
	this.cellCount = 0;
	this.island = [];
	this.selected = null;

	this.inBounds = inBounds;
	this.build = build;
	this.claim = claim;
	this.regions = regions;
	this.draw = draw;
	this.sqToHex = sqToHex;

	// if given coord lies inside the playable map area, return true, otherwise false
	function inBounds(x, y) {
		if (x >= 0 && x < this.size && y >= 0 && y < this.size && this.cells[x][y]) {
			return true;
		} else {
			return false;
		}
	}

	// create a two-dimentional array and fill playable areas with cell objects
	function build() {
		this.cells = new Array(this.size);
		for (var i = 0; i < this.size; i++) {
			this.cells[i] = new Array(this.size);
		}

		for (var y = 0; y < this.size; y++) {
			for (var x = 0; x < this.size; x++) {
				if (Math.abs(x-y) > this.size/2) {
					this.cells[x][y] = null;
				} else {
					// x coord, y coord
					this.cells[x][y] = new cell(x, y);
					this.cells[x][y].player = core.players[0];
				}
			}
		}
	}

	// assign cells to players
	function claim() {
		// x and y values to attempt to fill in map, starts in center
		var xTest = Math.floor(this.size/2);
		var yTest = Math.floor(this.size/2);

		// var for iterating through positions in island
		var isIt = 0;

		var active = core.randNum(core.pCount + 1);
		var nextPlayer = false;
		var direction;

		// number of cells to fill
		var toFill = (this.cellCount * this.fill) - ((this.cellCount * this.fill) % (core.pCount*2));
		while (toFill > 0) {
			// move in a random direction
			direction = core.adj[core.randNum(core.adj.length)];
			xTest += direction.x;
			yTest += direction.y;
			// if in-bounds and cell available: claim, add to island, decrease toFill and move to next player
			if (this.inBounds(xTest, yTest) && this.cells[xTest][yTest].player.id == 0) {
				this.cells[xTest][yTest].player = core.players[active];
				this.island.push(this.cells[xTest][yTest]);
				toFill--;
				if (nextPlayer) {
					active++;
				} else {
					nextPlayer = true;
				}
				if (active > core.pCount) {
					active = 1;
				}
			}
			// move to newly claimed cell, or to beginning of list
			isIt++;
			if (isIt >= this.island.length) {
				isIt = 0;
			}
			xTest = this.island[isIt].x;
			yTest = this.island[isIt].y;
		}
	}

	// group cells into regions
	function regions() {
		var master;
		var search;
		var run;
		var adj = [];
		var test;
		var connected = [];
		for (var i = 0; i < this.island.length; i++) {
			master = this.island[i];
			if (!master.region && !master.isolated()) {
				master.entity = new region();
				master.entity.bank = 10;
				master.region = master.entity;
				core.players[master.player.id].regions.push(master.region);
				master.region.capital = master;
				master.region.cells.push(master);

				search = master;
				run = true;
				while (run) {
					adj = search.findAdj();
					for (var n = 0; n < adj.length; n++) {
						test = adj[n];
						if (test.player == master.player && !test.region) {
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

	// draw the map
	function draw() {
		for (var y = 0; y < this.size+2; y++) {
			for (var x = 0; x < this.size+2; x++) {
				tile.draw(0, 0, x, y);
			}
		}

		var hexCoord;
		var sprite;
		for (var y = 0; y < this.size; y++) {
			for (var x = 0; x < this.size; x++) {
				if (!this.cells[x][y]) {
					continue;
				} else {
					hexCoord = this.sqToHex(x, y);
					if (!this.cells[x][y].entity) {
						sprite = 0;
					} else {
						switch (this.cells[x][y].entity.id) {
							case "troop":
								sprite = this.cells[x][y].entity.strength;
								break;
							case "region":
								sprite = 5;
								break;
							case "tower":
								sprite = 6;
								break;
						}
					}
				tile.draw(sprite, this.cells[x][y].player.id, hexCoord[0], hexCoord[1]);
				}
			}
		}

		if (this.selected) {
			var hexCoord = this.sqToHex(this.selected.x, this.selected.y);
			tile.draw(1, 0, hexCoord[0], hexCoord[1]);
		}
	}

	// convert locations in map.cells array to output hexagons on the map
	function sqToHex(x, y) {
		var result = [];
		y = (Math.floor(this.size/2)*.5) + (y+1) - (x*.5);
		x = (x+1);
		result.push(x);
		result.push(y);
		return result;
	}
}
