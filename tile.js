function tileObj(w, h) {
	this.w = w;
	this.h = h;

	this.draw = draw;
	function draw(ctx, xSprite, ySprite, xDraw, yDraw, width) {
		if (arguments.length == 5) {
			ctx.drawImage(this.img, xSprite * this.w, ySprite * this.h, this.w, this.h, xDraw * this.w, yDraw * this.h, this.w, this.h);
		} else {
			ctx.drawImage(this.img, xSprite * this.w, ySprite * this.h, this.w * width, this.h, xDraw * this.w, yDraw * this.h, this.w * width, this.h);
		}
	}
}
