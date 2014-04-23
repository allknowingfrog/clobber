// draw the output sidebar
output.draw = function() {
	ctx.clearRect(this.left * tile.w, 0, canvas.width, canvas.height);
	tile.draw(0, core.active, this.left, this.top);
	var turn = Math.floor(core.turn/core.pCount) + 1;
	ctx.fillText("Turn: " + turn, (this.left + 1) * tile.w, this.top * tile.h + core.fontSize);
	// if a region is selected, draw value of bank
	if (map.selected && map.selected.region) {
		var bank = map.selected.region.bank;
		tile.draw(5, core.active, this.left, this.top + 1);
		ctx.fillText("Bank: " + bank, (this.left + 1) * tile.w, (this.top + 1) * tile.h + core.fontSize);
		// if bank is high enough, draw troop and tower icons
		if (bank >= 10) {
			tile.draw(1, core.active, this.left + 1, this.top + 3);
			if (bank >= 15) {
				tile.draw(6, core.active, this.left + 2, this.top + 3);
			}
		}
	}
}
