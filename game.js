function game(core, map, output, canvas, ctx, tile) {
	map.build();
	map.claim(core);
	map.regions(core);
	map.draw(ctx, tile);
	output.draw(core, ctx, tile);
}
