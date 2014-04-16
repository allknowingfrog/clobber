function region() {
	this.id = "region";
	this.strength = 2;
	this.capital = null;
	this.cells = [];
	this.bank = 10;
	this.troops = [];

	this.tax = tax;
	this.adj = adj;
	this.update = update;
	this.absorb = absorb;
	this.addConnected = addConnected;

	function tax() {
		this.bank += this.cells.length;
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

	function update() {
		var test = this.cells.slice();
		this.cells = [];
		for (var i = 0; i < test.length; i++) {
			test.region = null;
		}

		this.capital.region = this;
		this.cells.push(this.capital);
		this.addConnected();

		for (var i = 0; i < test.length; i++) {
			master = test[i];
			if (!master.region && !master.isolated()) {
				master.entity = new region();
				master.region = master.entity;
				core.players[master.player].regions.push(master.region);
				master.region.capital = master;
				master.region.cells.push(master);
				master.addConnected();
			}
		}
	}

	function addConnected() {
		var search = this.capital;
		var adj = [];
		var connected = [];
		var test;
		var run = true;
		while (run) {
			adj = search.findAdj();
			for (var n = 0; n < adj.length; n++) {
				test = adj[n];
				if (test.player == this.player && !test.region) {
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

	function absorb(target) {
		this.bank += target.bank;
		for (var i = 0; i < target.cells.length; i++) {
			target.cells[i].region = this;
			this.cells.push(target.cells[i]);
		}
		target.capital.entity = null;
	}
}
