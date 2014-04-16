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

	function isAdj(test) {
		for (var i = 0; i < core.adj.length; i++) {
			if (this.x + core.adj[i].x == test.x && this.y + core.adj[i].y == test.y) {
				return true;
			}
		}
		return false;
	}

	function isolated() {
		var neighbors = this.findAdj();
		for (var i = 0; i < neighbors.length; i++) {
			if (neighbors[i].player == this.player) {
				return false;
			}
		}
		return true;
	}

	function buyTroop() {
		var troops = core.players[this.player.id].troops;
		if (!this.entity && this.region.bank >= 10) {
			troops.push(new troop());
			this.entity = troops[troops.length-1];
			this.region.bank -= 10;
		}
	}

	function buyTower() {
		if (!this.entity && this.region.bank >= 15) {
			this.entity = new tower();
			this.region.bank -= 15;
		}
	}

	function attack(d) {
		if (this.entity.ready) {
			if (!d.entity && d.region == this.region) {
				d.entity = this.entity;
				this.entity = null;
			} else if (this.region.adj(d) && d.defend() < this.entity.strength) {
				var dReg = d.region;
				d.player = this.player;
				d.region = this.region;
				this.region.cells.push(d);
				d.entity = this.entity;
				d.entity.ready = false;
				this.entity = null;
				if (dReg) {
					dReg.update();
				}
				var neighbors = d.findAdj();
				for (var i = 0; i < neighbors.length; i++) {
					var test = neighbors[i];
					if (test.player == this.player) {
						if (!test.region) {
							test.region = this.region;
							this.region.cells.push(test);
						} else if (test.region != this.region) {
							this.region.absorb(test.region);
						}
					}
				}
			}
		}
		map.selected = null;
	}

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
