function coreObj(pCount) {
	this.pCount = pCount;
	this.players = [];
	this.adj = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];
	this.active = 1;

	this.game = game;
	this.input = input;
	this.randNum = randNum;

	function game(map, output, canvas, ctx, tile) {
		map.build();
		map.claim(this);
		map.regions(this);
		map.draw(ctx, tile);
		output.draw(this, ctx, tile);
	}

	function input(map, output, ctx, tile, x, y) {
		if (x < (map.size+1) * tile.w) {
			x = Math.floor(x/tile.w) - 1;
			y = Math.floor((y - ((Math.floor(map.size/2))*(tile.h/2)) + (x*(tile.h/2))) / tile.h) - 1;
			var test = map.cells[x][y];
			if (test != -1 && test.player != 0) {
				map.selected = map.cells[x][y];
				map.draw(ctx, tile);
			}
		} else {

		}
	}

	function randNum(ints) {
		return Math.floor((Math.random()*ints));
	}
}
