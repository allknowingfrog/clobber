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
		// if d isn't this cell and troop has not moved this turn
		if (d != this && this.entity.ready) {
			// if d is part of the same region
			if (d.region == this.region) {
				// if d is empty, free move
				if (!d.entity) {
					d.entity = this.entity;
					this.entity = null;
				// if d is also a troop, attempt to combine
				} else if (d.entity.id == "troop" && d.entity.strength + this.entity.strength <= 4) {
					d.entity.strength += this.entity.strength;
					this.entity.alive = false;
					this.entity = null;
				}
			// if d is adjacent to this region, and has a lower defense than this troop strength
			} else if (this.region.adj(d) && d.defend() < this.entity.strength) {
				// store region to update later
				var dRegion = d.region;

				// if d was the capital, choose a new capital for the region
				if (d.entity && d.entity.id == "region") {
					dRegion = d.region.moveCapital();
				}

				// capture cell
				this.region.addCell(d);

				// move troop to new cell
				d.entity = this.entity;
				d.entity.ready = false;
				this.entity = null;

				// if d had no region, dRegion will be null
				if (dRegion) {
					dRegion.update();
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
