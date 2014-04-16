function player() {
	this.regions = [];
	this.troops = [];
	this.id;

	this.update = update;
	function update() {
		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].tax();
		}
		for (var i = 0; i < this.troops.length; i++) {
			if (this.troops[i].alive == false) {
				this.troops.splice(i, 1);
			}
		}
		for (var i = 0; i < this.troops.length; i++) {
			this.troops[i].ready = true;
		}
	}
}
