function cell(x, y) {
	this.x = x;
	this.y = y;
	this.player;
	this.entity = 0;
	this.region = null;

	this.findAdj = findAdj;
	this.isAdj = isAdj;
	this.isolated = isolated;
	this.buyTroop = buyTroop;
	this.buyTower = buyTower;
	this.moveTroop = moveTroop;
	this.attack = attack;
	this.defend = defend;

	// return a list of adjacent cells (including enemy cells, but not empty cells)
	function findAdj() {
		var result = [];
		var xTest;
		var yTest;
		for (var i = 0; i < adjacent.length; i++) {
			xTest = this.x + adjacent[i].x;
			yTest = this.y + adjacent[i].y;
			if (map.inBounds(xTest, yTest)) {
				result.push(map.cells[xTest][yTest]);
			}
		}
		return result;
	}

	// return true if test is adjacent to this cell, otherwise false
	function isAdj(test) {
		for (var i = 0; i < adjacent.length; i++) {
			if (this.x + adjacent[i].x == test.x && this.y + adjacent[i].y == test.y) {
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
		var troops = this.player.troops;
		var village = this.region.capital.entity;
		if (village.bank >= 10) {
			if (!this.entity) {
				troops.push(new troop());
				this.entity = troops[troops.length-1];
				village.bank -= 10;
			} else if (this.entity.id == "troop" && this.entity.strength < 4) {
				this.entity.strength++;
				village.bank -= 10;
			}
		}
	}

	// add tower
	function buyTower() {
		if (!this.entity && this.region.capital.entity.bank >= 15) {
			this.entity = new tower();
			this.region.capital.entity.bank -= 15;
		}
	}

	function moveTroop(target) {
		// if target isn't this cell and troop has not moved this turn...
		if (target != this && this.entity.ready) {
			// ...and target is part of the same region...
			if (target.region == this.region) {
				// ...and target is empty, free move
				if (!target.entity) {
					target.entity = this.entity;
					this.entity = null;
				// ...and target is also a troop, attempt to combine
				} else if (target.entity.id == "troop" && target.entity.strength + this.entity.strength <= 4) {
					target.entity.strength += this.entity.strength;
					this.entity.alive = false;
					this.entity = null;
				}
			// ...and target is adjacent to this region, and has a lower defense than this troop strength
			} else if (this.region.adj(target) && target.defend() < this.entity.strength) {
				this.attack(target);
			}
		}
		map.selected = null;
	}

	function attack(d) {
		if (d.region) {
			d.region.dropCell(d);
		}
		this.region.addCell(d);

		// move troop to new cell
		d.entity = this.entity;
		d.entity.ready = false;
		this.entity = null;

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
