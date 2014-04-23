function region(num, cell, bank) {
	this.id = "region";
	this.num = num;
	this.alive = true;
	this.player = cell.player;
	this.capital = cell;
	this.cells = [];
	this.troops = [];

	cell.region = this;
	cell.entity = new village(this, bank);
	this.cells.push(cell);

	this.tax = tax;
	this.spend = spend;
	this.updateTroops = updateTroops;
	this.starve = starve;
	this.adj = adj;
	this.dropCell = dropCell;
	this.absorb = absorb;
	this.addConnected = addConnected;
	this.addCell = addCell;

	// collect income from each cell in region
	function tax() {
		this.capital.entity.bank += this.cells.length;
	}

	function spend() {
		var cell;
		for (var i = 0; i < this.cells.length; i++) {
			cell = this.cells[i];
			if (cell.entity && cell.entity.id == "troop") {
				switch (cell.entity.strength) {
					case 1:
						this.capital.entity.bank -= 2;
						break;
					case 2:
						this.capital.entity.bank -= 6;
						break;
					case 3:
						this.capital.entity.bank -= 18;
						break;
					case 4:
						this.capital.bank.bank -= 54;
						break;
				}
				if (this.capital.entity.bank < 0) {
					this.capital.entity.bank = 0;
					this.starve();
					return;
				}
			}
		}
	}

	function updateTroops() {
		// remove dead troops
		for (var i = this.troops.length-1; i >= 0; i--) {
			if (this.troops[i].alive == false) {
				this.troops.splice(i, 1);
			}
		}
		// set all troops to ready
		for (var i = 0; i < this.troops.length; i++) {
			this.troops[i].ready = true;
		}
	}

	function starve() {
		var cell;
		for (var i = 0; i < this.cells.length; i++) {
			cell = this.cells[i];
			if (cell.entity && cell.entity.id == "troop") {
				cell.entity.alive = false;
				cell.entity = null;
			}
		}
	}

	// return true if passed cell is adjacent to any cell in this region
	function adj(test) {
		neighbors = test.findAdj();
		for (var i = 0; i < neighbors.length; i++) {
			if (neighbors[i].region == this) {
				return true;
			}
		}
		return false;
	}

	function dropCell(target) {
		target.player = 0;
		target.region = null;
		if (target.entity) {
			// if target was the capital, choose a new capital for the region
			if (target.entity.id == "village") {
				var test;
				for (var i = 0; i < this.cells.length; i++) {
					test = this.cells[i];
					if (!test.entity) {
						test.entity = new village(this, 0);
						this.capital = test;
						break;
					}
				}
			// if target was a troop, set alive to false
			} else if (target.entity.id == "troop") {
				target.entity.alive = false;
			}
			target.entity = null;
		}

		// remove target from array of cells
		for (var i = this.cells.length-1; i >= 0; i--) {
			if (this.cells[i] == target) {
				this.cells.splice(i, 1);
			}
		}

		// reassign region cells (some may have been severed)
		var test = this.cells.slice();
		this.cells = [this.capital];
		this.troops = [];

		for (var i = 0; i < test.length; i++) {
			test[i].region = null;
		}

		this.capital.region = this;

		// if capital is last cell in region, destroy it, otherwise, add connected cells
		if (this.capital.isolated()) {
			this.capital.entity = null;
			this.capital.region = null;
			this.alive = false;
		} else {
			this.addConnected();
		}

		// cells without regions in test have been severed, create new regions until each cell is assigned
		var master;
		for (var i = 0; i < test.length; i++) {
			master = test[i];
			if (!master.region && !master.isolated()) {
				master.player.regions.push(new region(regNum++, master, 0));
				master.region.addConnected();
			}
		}
	}

	// find all cells connected to capital and add to region (cell.region must be cleared first)
	function addConnected() {
		var search = this.capital;
		var adj = [];
		var connected = [];
		var test;
		var run = true;
		while (run) {
			adj = search.findAdj();
			for (var i = 0; i < adj.length; i++) {
				test = adj[i];
				if (test.player == this.player && !test.region) {
					test.region = this;
					this.cells.push(test);
					connected.push(test);
					if (test.entity && test.entity.id == "troop") {
						this.troops.push(test.entity);
					}
				}
			}

			if (connected.length == 0) {
				run = false;
			}
			search = connected.pop();
		}
	}

	// absorb target friendly region into this region
	function absorb(target) {
		this.capital.entity.bank += target.capital.entity.bank;
		this.troops = this.troops.concat(target.troops);
		for (var i = 0; i < target.cells.length; i++) {
			target.cells[i].region = this;
			this.cells.push(target.cells[i]);
		}
		target.capital.entity = null;
		target.alive = false;
	}

	// absorb target cell into this region
	function addCell(target) {
		target.player = this.player;
		target.region = this;
		this.cells.push(target);
	}
}
