function tileObj(w, h) {
	this.w = w;
	this.h = h;

	this.draw = draw;
	function draw(xSprite, ySprite, xDraw, yDraw) {
		ctx.drawImage(this.img, xSprite * this.w, ySprite * this.h, this.w, this.h, xDraw * this.w, yDraw * this.h, this.w, this.h);
	}
}
