$(document).ready(function() {

	canvas = document.getElementById("canvas");

	ctx = canvas.getContext("2d");

	canvas.width = tile.w * (map.size + 2 + output.w);
	canvas.height = tile.h * (map.size + 2);

	canvas.style = "background-color:black";

	ctx.font = fontSize + "px Arial";
	ctx.fillStyle = "white";

	// draw functions (need ctx)
	tile.draw = function (xSprite, ySprite, xDraw, yDraw) {
		ctx.drawImage(this.img, xSprite * this.w, ySprite * this.h, this.w, this.h, xDraw * this.w, yDraw * this.h, this.w, this.h);
	};

	map.draw = function() {
		for (var y = 0; y < this.size+2; y++) {
			for (var x = 0; x < this.size+2; x++) {
				tile.draw(0, 0, x, y);
			}
		}

		var hexCoord;
		var sprite;
		var highlight;
		var test;
		for (var y = 0; y < this.size; y++) {
			for (var x = 0; x < this.size; x++) {
				if (!this.cells[x][y]) {
					continue;
				} else {
					highlight = null;
					hexCoord = this.sqToHex(x, y);
					test = this.cells[x][y];
					if (!test.entity) {
						sprite = 0;
					} else {
						switch (test.entity.id) {
							case "troop":
								sprite = test.entity.strength;
								if (test.player == active && test.entity.ready == true) {
									highlight = "troop";
								}
								break;
							case "village":
								sprite = 5;
								if (test.player == active && test.entity.bank >= 10) {
									highlight = "village";
								}
								break;
							case "tower":
								sprite = 6;
								break;
						}
					}
					tile.draw(sprite, test.player.id, hexCoord[0], hexCoord[1]);
					switch (highlight) {
						case null:
							break;
						case "troop":
							tile.draw(2, 0, hexCoord[0], hexCoord[1]);
							break;
						case "village":
							tile.draw(3, 0, hexCoord[0], hexCoord[1]);
							break;
					}
				}
			}
		}

		if (this.selected) {
			var hexCoord = this.sqToHex(this.selected.x, this.selected.y);
			tile.draw(1, 0, hexCoord[0], hexCoord[1]);
		}
	};

	output.draw = function() {
		ctx.clearRect(this.left * tile.w, 0, canvas.width, canvas.height);
		tile.draw(0, active.id, this.left, this.top);
		ctx.fillText("Turn: " + gameTurn, (this.left + 1) * tile.w, this.top * tile.h + fontSize);
		// if a region is selected, draw value of bank
		if (map.selected && map.selected.region) {
			var bank = map.selected.region.capital.entity.bank;
			tile.draw(5, active.id, this.left, this.top + 1);
			ctx.fillText("Bank: " + bank, (this.left + 1) * tile.w, (this.top + 1) * tile.h + fontSize);
			// if bank is high enough, draw troop and tower icons
			if (bank >= 10) {
				tile.draw(1, active.id, this.left + 1, this.top + 3);
				if (bank >= 15) {
					tile.draw(6, active.id, this.left + 2, this.top + 3);
				}
			}
		}
	};

	draw = function() {
		map.draw();
		output.draw();
	};

	// input function (requires draw functions)
	canvas.onclick = function(e) {
		// find pixel location of click relative to canvas
		var rect = canvas.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		// if click was on map, convert pixels to hex coords
		if (x < (map.size+1) * tile.w) {
			x = Math.floor(x/tile.w) - 1;
			y = Math.floor((y - ((Math.floor(map.size/2))*(tile.h/2)) + (x*(tile.h/2))) / tile.h) - 1;
			// choose an action based on contents of selected cell and clicked cell
			var test = map.cells[x][y];
			/*if (test.region) {
				$("#output").text(test.region.num);
			}*/
			if (map.selected && map.selected.entity && map.selected.entity.id == "troop" && test.player.id != 0) {
				map.selected.moveTroop(test);
			} else if (test.player == active) {
				map.selected = map.cells[x][y];
			} else if (!test || test.player.id == 0) {
				map.selected = null;
			}
		// if click wasn't on the map, check output buttons
		} else if (x >= output.left * tile.w && x < (output.left + 1) * tile.w && y >= output.top * tile.w && y < (output.top + 1) * tile.h) {
			endTurn();
		} else if (x >= (output.left + 1) * tile.w && x < (output.left + 2) * tile.w && y >= (output.top + 3) * tile.w && y < (output.top + 4) * tile.h) {
			map.selected.buyTroop();
		} else if (x >= (output.left + 2) * tile.w && x < (output.left + 3) * tile.w && y >= (output.top + 3) * tile.w && y < (output.top + 4) * tile.h) {
			map.selected.buyTower();
		}
		draw();
	};

	activeIt = 1;
	active = players[activeIt];
	draw();
	active.update();
});
