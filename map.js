// if given coord lies inside the playable map area, return true, otherwise false
map.inBounds = function(x, y) {
	if (x >= 0 && x < this.size && y >= 0 && y < this.size && this.cells[x][y]) {
		return true;
	} else {
		return false;
	}
};

// convert locations in map.cells array to output hexagons on the map
map.sqToHex = function(x, y) {
	var result = [];
	y = (Math.floor(this.size/2)*.5) + (y+1) - (x*.5);
	x = (x+1);
	result.push(x);
	result.push(y);
	return result;
};
