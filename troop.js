function troop(cell) {
	this.id = "troop";
	this.cell = cell;
	this.strength = 1;
	this.alive = true;
	this.ready = true;

	cell.entity = this;
	cell.region.troops.push(this);
}
