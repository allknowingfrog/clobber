function outputObj(w) {
	this.w = w;
	this.top = 2;
	this.left;

	this.draw = draw;
	function draw(core, ctx, tile) {
		tile.draw(ctx, 6, 0, this.left, this.top, 3);
		tile.draw(ctx, 0, core.active, this.left + 3, this.top);
		ctx.fillText("Bank: " + 7, output.left, output.top + 1.5);
		tile.draw(ctx, 1, core.active, this.left + 1, this.top + 3);
		tile.draw(ctx, 6, core.active, this.left + 2, this.top + 3);
	}
}
