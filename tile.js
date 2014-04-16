// tile is a global object, tileObj() should only be used to create var tile
function tileObj(w, h) {
	this.w = w;
	this.h = h;

	this.draw = draw;

	// draw sprite at given coords to map at given coords (takes in coords, not absolute pixel locations)
	function draw(xSprite, ySprite, xDraw, yDraw) {
		ctx.drawImage(this.img, xSprite * this.w, ySprite * this.h, this.w, this.h, xDraw * this.w, yDraw * this.h, this.w, this.h);
	}
}
