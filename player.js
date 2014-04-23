function player(id, computer) {
	this.id = id;
	this.computer = computer;
	this.regions = [];
	this.troops = [];

	this.update = update;

	// update arrays and values for new turn
	function update() {
		// remove dead regions
		for (var i = this.regions.length-1; i >= 0; i--) {
			if (this.regions[i].alive == false) {
				this.regions.splice(i, 1);
			}
		}
		// collect income, pay maintenance
		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].updateTroops();
			this.regions[i].tax();
			this.regions[i].spend();
		}
		// remove dead troops
		for (var i = this.troops.length-1; i >= 0; i--) {
			if (this.troops[i].alive == false) {
				this.troops.splice(i, 1);
			}
		}
	}
}
