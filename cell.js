function cell(x, y) {
	this.x = x;
	this.y = y;
	this.player = 0;
	this.entity = 0;
	this.region = -1;

	this.findAdj = findAdj;
	this.isolated = isolated;

	function findAdj(map, adj) {
		var result = [];
		var neighbor;
		var xTest;
		var yTest;
		for (var i = 0; i < adj.length; i++) {
			xTest = this.x + adj[i].x;
			yTest = this.y + adj[i].y;
			if (map.inBounds(xTest, yTest)) {
				neighbor = map.cells[xTest][yTest];
				if (neighbor != -1) {
					result.push(neighbor);
				}
			}
		}
		return result;
	}

	function isolated(map, adj) {
		var neighbors = this.findAdj(map, adj);
		for (var i = 0; i < neighbors.length; i++) {
			if (neighbors[i].player == this.player) {
				return false;
			}
		}
		return true;
	}
}
