function cell(x, y) {
	this.x = x;
	this.y = y;
	this.player;
	this.entity = 0;
	this.region = null;
	this.troop = null;

	this.findAdj = findAdj;
	this.isAdj = isAdj;
	this.isolated = isolated;
	this.buyTroop = buyTroop;
	this.buyTower = buyTower;
	this.attack = attack;
	this.defend = defend;

	// return a list of adjacent cells (including enemy cells, but not empty cells)
	function findAdj() {
		var result = [];
		var neighbor;
		var xTest;
		var yTest;
		for (var i = 0; i < core.adj.length; i++) {
			xTest = this.x + core.adj[i].x;
			yTest = this.y + core.adj[i].y;
			if (map.inBounds(xTest, yTest)) {
				neighbor = map.cells[xTest][yTest];
				if (neighbor) {
					result.push(neighbor);
				}
			}
		}
		return result;
	}

	// return true if test is adjacent to this cell, otherwise false
	function isAdj(test) {
		for (var i = 0; i < core.adj.length; i++) {
			if (this.x + core.adj[i].x == test.x && this.y + core.adj[i].y == test.y) {
				return true;
			}
		}
		return false;
	}

	// if adjacent to at least one friendly cell, return false, otherwise true
	function isolated() {
		var neighbors = this.findAdj();
		for (var i = 0; i < neighbors.length; i++) {
			if (neighbors[i].player == this.player) {
				return false;
			}
		}
		return true;
	}

	// add new troop or upgrade existing troop
	function buyTroop() {
		var troops = core.players[this.player.id].troops;
		if (this.region.bank >= 10) {
			if (!this.entity) {
				troops.push(new troop());
				this.entity = troops[troops.length-1];
				this.region.bank -= 10;
			} else if (this.entity.id == "troop" && this.entity.strength < 4) {
				this.entity.strength++;
				this.region.bank -= 10;
			}
		}
	}

	// add tower
	function buyTower() {
		if (!this.entity && this.region.bank >= 15) {
			this.entity = new tower();
			this.region.bank -= 15;
		}
	}

	// attempt to move troop from this cell to cell d
	function attack(d) {
		// if troop has not move this turn
		if (this.entity.ready) {
			// if d is empty and part of the same region, free move to new cell
			if (!d.entity && d.region == this.region) {
				d.entity = this.entity;
				this.entity = null;
			// if d is adjacent to this region, and has a lower defense than this troop strength
			} else if (this.region.adj(d) && d.defend() < this.entity.strength) {
				// this region will need to be updated after d is captured
				var dReg = d.region;

				// if d is the capital of a region with 3 or more cells, create a new region
				if (d.entity && d.entity.id == "region") {
					if (d.region.cells.length < 3) {
						dReg = null;
					} else {
						// create a new region in the first empty cell
						var cells = dReg.cells.splice();
						var test;
						for (var i = 0; i < cells.length; i++) {
							test = cells[i];
							if (test.entity) {
								continue;
							} else {
								test.entity = new region();
								test.entity.cells = cells.splice();
								test.player.regions.push(test.entity);
								break;
							}
						}
						// set dReg to this new region
						dReg = test.entity;
					}
				}

				this.region.addCell(d);

				// move troop to new cell
				d.entity = this.entity;
				d.entity.ready = false;
				this.entity = null;

				// if d was a capital with fewer than 3 cells, dReg will be null
				if (dReg) {
					dReg.update();
				}

				// check if attack has connected friendly cells or regions and absorb them
				var neighbors = d.findAdj();
				for (var i = 0; i < neighbors.length; i++) {
					var test = neighbors[i];
					if (test.player == this.player) {
						if (!test.region) {
							this.region.addCell(test);
						} else if (test.region != this.region) {
							this.region.absorb(test.region);
						}
					}
				}
			}
		}
		map.selected = null;
	}

	// check strength of this and adjacent cells, return highest value
	function defend() {
		var neighbors = this.findAdj();
		var defense = 0;
		var strength;
		var test;
		if (this.entity) {
			defense = this.entity.strength;
		}
		for (var i = 0; i < neighbors.length; i++) {
			test = neighbors[i];
			if (test.player == this.player && test.entity) {
				strength = test.entity.strength;
				if (strength > defense) {
					defense = strength;
				}
			}
		}
		return defense;
	}
}
