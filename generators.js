module.exports = {
    this.radiate = function(mapsize, fill, players) {
        //x and y values to attempt to fill in map, starts in center
        var xTest = Math.floor(map.size/2);
        var yTest = Math.floor(map.size/2);

        // iterating vars (island and player)
        var isIt = 0;
        var pIt = 0;

        var direction;

        // number of cells to fill
        var toFill = (map.cellCount * map.fill) - ((map.cellCount * map.fill) % (2 * players.length));
        while(toFill > 0) {
            // move in a random direction
            direction = map.adjacent[Math.floor((Math.random()*map.adjacent.length))];
            xTest += direction.x;
            yTest += direction.y;
            // if cell available: claim, add to island, decrease toFill and move to next player
            if(map.cells[xTest] && map.cells[xTest][yTest] && !map.cells[xTest][yTest].player) {
                map.cells[xTest][yTest].player = players[pIt];
                map.island.push(map.cells[xTest][yTest]);
                toFill--;
                if(nextPlayer) {
                    pIt++;
                    nextPlayer = false;
                } else {
                    nextPlayer = true;
                }
                if(pIt >= players.length) {
                    pIt = 0;
                }
            }
            // move to newly claimed cell, or to beginning of list
            isIt++;
            if(isIt >= map.island.length) {
                isIt = 0;
            }
            xTest = map.island[isIt].x;
            yTest = map.island[isIt].y;
        }
    };

    this.fill = function() {
        for(var x=0; x<map.size; x++) {
            for(var y=0; y<map.size; y++) {
                //null out corners of array to leave hexagon-shaped map
                if(x+y < map.origin || x+y >= (map.size*2)-map.origin) {
                    map.cells[x][y] = null;
                } else {
                    map.cells[x][y] = new map.cell(x, y);
                }
            }
        }
    };
};
