function region() {
	this.id = "region";
	this.strength = 1;
	this.capital = null;
	this.cells = [];
	this.bank = 0;
	this.troops = [];

	this.tax = tax;
	this.spend = spend;
	this.starve = starve;
	this.adj = adj;
	this.update = update;
	this.absorb = absorb;
	this.addConnected = addConnected;
	this.addCell = addCell;

	// collect income from each cell in region
	function tax() {
		this.bank += this.cells.length;
	}

	function spend() {
		var cell;
		for (var i = 0; i < this.cells.length; i++) {
			cell = this.cells[i];
			if (cell.entity && cell.entity.id == "troop") {
				switch (cell.entity.strength) {
					case 1:
						this.bank -= 2;
						break;
					case 2:
						this.bank -= 6;
						break;
					case 3:
						this.bank -= 18;
						break;
					case 4:
						this.bank -= 54;
						break;
				}
				if (this.bank < 0) {
					this.bank = 0;
					this.starve();
					return;
				}
			}
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

	// check whether cells have been captured or severed from region, create new regions if necessary
	function update() {
		var test = this.cells.slice();
		this.cells = [];
		for (var i = 0; i < test.length; i++) {
			if (test[i].player == this.capital.player) {
				test[i].region = null;
			}
		}

		// if capital is last cell in region, destroy it, otherwise, add connected cells
		if (this.capital.isolated()) {
			this.capital.entity = null;
		} else {
			this.capital.region = this;
			this.cells.push(this.capital);
			this.addConnected();
		}

		// cells without regions in test have been severed, create new regions until each cell is assigned
		for (var i = 0; i < test.length; i++) {
			master = test[i];
			if (!master.region && !master.isolated()) {
				master.entity = new region();
				master.region = master.entity;
				master.player.regions.push(master.region);
				master.region.capital = master;
				master.region.cells.push(master);
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
				if (test.player == this.capital.player && !test.region) {
					test.region = this;
					this.cells.push(test);
					connected.push(test);
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
		this.bank += target.bank;
		for (var i = 0; i < target.cells.length; i++) {
			target.cells[i].region = this;
			this.cells.push(target.cells[i]);
		}
		target.capital.entity = null;
	}

	// absorb target cell into this region
	function addCell(target) {
		target.player = this.capital.player;
		target.region = this;
		this.cells.push(target);
	}
}
