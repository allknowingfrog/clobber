// start a new turn
core.startTurn = function() {
	this.players[this.active].update();
};

// advance counters to next player and call startTurn()
core.endTurn = function() {
	map.selected = null;
	this.active++;
	if (this.active > this.pCount) {
		this.active = 1;
	}
	this.turn++;
	this.startTurn();
};
