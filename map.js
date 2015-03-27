module.exports = {
    cell: function(x, y) {
        this.x = x;
        this.y = y;
        this.player;
        this.entity = 0;
        this.region = null;

        // return a list of adjacent cells (including enemy cells, but not empty cells)
        this.findAdj = function() {
            var adjacent = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: -1}];
            var result = [];
            var xTest;
            var yTest;
            for (var i = 0; i < adjacent.length; i++) {
                xTest = this.x + adjacent[i].x;
                yTest = this.y + adjacent[i].y;
                if (map.cells[xTest][yTest]) {
                    result.push(map.cells[xTest][yTest]);
                }
            }
            return result;
        };

        // return true if test is adjacent to this cell, otherwise false
        this.isAdj = function(test) {
            for (var i = 0; i < adjacent.length; i++) {
                if (this.x + adjacent[i].x == test.x && this.y + adjacent[i].y == test.y) {
                    return true;
                }
            }
            return false;
        };

        // if adjacent to at least one friendly cell, return false, otherwise true
        this.isolated = function() {
            var neighbors = this.findAdj();
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i].player == this.player) {
                    return false;
                }
            }
            return true;
        };

        // add new troop or upgrade existing troop
        this.buyTroop = function() {
            var troops = this.player.troops;
            var village = this.region.capital.entity;
            if (village.bank >= 10) {
                if (!this.entity) {
                    troops.push(new troop(this));
                    village.bank -= 10;
                } else if (this.entity.id == "troop" && this.entity.strength < 4) {
                    this.entity.strength++;
                    village.bank -= 10;
                }
            }
        };

        // add tower
        this.buyTower = function() {
            if (!this.entity && this.region.capital.entity.bank >= 15) {
                this.entity = new tower();
                this.region.capital.entity.bank -= 15;
            }
        };

        // return true if move successful, otherwis false
        this.moveTroop = function(target) {
            // if target isn't this cell and troop has not moved this turn...
            if (target != this && this.entity.ready) {
                // ...and target is part of the same region...
                if (target.region == this.region) {
                    // ...and target is empty, free move
                    if (!target.entity) {
                        target.entity = this.entity;
                        target.entity.cell = target;
                        this.entity = null;
                        map.selected = null;
                        return true;
                        // ...and target is also a troop, attempt to combine
                    } else if (target.entity.id == "troop" && target.entity.strength + this.entity.strength <= 4) {
                        target.entity.strength += this.entity.strength;
                        this.entity.alive = false;
                        this.entity = null;
                        if (target.entity.ready) {
                            map.selected = target;
                        } else {
                            map.selected = null;
                        }
                        return true;
                    } else {
                        map.selected = null;
                        return false;
                    }
                    // ...and target is adjacent to this region, and has a lower defense than this troop strength
                } else if (this.region.adj(target) && target.defend() < this.entity.strength) {
                    this.attack(target);
                    map.selected = null;
                    return true;
                } else {
                    map.selected = null;
                    return false;
                }
            } else {
                map.selected = null;
                return false;
            }
        };

        this.attack = function(d) {
            if (d.region) {
                d.region.dropCell(d);
            }
            this.region.addCell(d);

            // move troop to new cell
            d.entity = this.entity;
            d.entity.cell = d;
            d.entity.ready = false;
            this.entity = null;

            // check if attack has connected friendly cells or regions and absorb them
            var neighbors = d.findAdj();
            for (var i = 0; i < neighbors.length; i++) {
                var test = neighbors[i];
                if (test.player == this.player) {
                    if (!test.region) {
                        this.region.addCell(test);
                    } else if (test.region != this.region) {
                        this.region.absorb(test.region);
                    }
                }
            }
        };

        // check strength of this and adjacent cells, return highest value
        this.defend = function() {
            var neighbors = this.findAdj();
            var defense = 0;
            var strength;
            var test;
            if (this.entity) {
                defense = this.entity.strength;
            }
            for (var i = 0; i < neighbors.length; i++) {
                test = neighbors[i];
                if (test.player == this.player && test.entity) {
                    strength = test.entity.strength;
                    if (strength > defense) {
                        defense = strength;
                    }
                }
            }
            return defense;
        };
    },

    region: function (num, cell, bank) {
        this.id = "region";
        this.num = num;
        this.alive = true;
        this.player = cell.player;
        this.capital = cell;
        this.cells = [];
        this.troops = [];

        cell.region = this;
        cell.entity = new village(this, bank);
        this.cells.push(cell);

        this.updateTroops = function() {
            // remove dead troops
            for (var i = this.troops.length-1; i >= 0; i--) {
                if (this.troops[i].alive == false) {
                    this.troops.splice(i, 1);
                }
            }
            // set all troops to ready
            for (var i = 0; i < this.troops.length; i++) {
                this.troops[i].ready = true;
            }
        };

        // collect income from each cell in region
        this.tax = function() {
            this.capital.entity.bank += this.cells.length;
        };

        this.spend = function() {
            var cell;
            for (var i = 0; i < this.cells.length; i++) {
                cell = this.cells[i];
                if (cell.entity && cell.entity.id == "troop") {
                    switch (cell.entity.strength) {
                        case 1:
                            this.capital.entity.bank -= 2;
                            break;
                        case 2:
                            this.capital.entity.bank -= 6;
                            break;
                        case 3:
                            this.capital.entity.bank -= 18;
                            break;
                        case 4:
                            this.capital.entity.bank -= 54;
                            break;
                    }
                    if (this.capital.entity.bank < 0) {
                        this.capital.entity.bank = 0;
                        this.starve();
                        return;
                    }
                }
            }
        };

        this.starve = function() {
            var cell;
            for (var i = 0; i < this.cells.length; i++) {
                cell = this.cells[i];
                if (cell.entity && cell.entity.id == "troop") {
                    cell.entity.alive = false;
                    cell.entity = null;
                }
            }
            this.troops = [];
        };

        // return true if passed cell is adjacent to any cell in this region
        this.adj = function(test) {
            neighbors = test.findAdj();
            for (var i = 0; i < neighbors.length; i++) {
                if (neighbors[i].region == this) {
                    return true;
                }
            }
            return false;
        };

        this.dropCell = function(target) {
            target.player = 0;
            target.region = null;
            if (target.entity) {
                // if target was the capital, choose a new capital for the region
                if (target.entity.id == "village") {
                    var test;
                    var newCap;
                    for (var i = 0; i < this.cells.length; i++) {
                        test = this.cells[i];
                        if (!test.entity) {
                            newCap = test;
                            break;
                        } else if (test.entity.id == "tower") {
                            newCap = test;
                        } else if (!newCap || newCap.entity.id != "tower" && test.entity.strength < newCap.entity.strength) {
                            newCap = test;
                        }
                    }
                    if (newCap.entity && newCap.entity.id == "troop") {
                        newCap.entity.alive = false;
                    }
                    newCap.entity = new village(this, 0);
                    this.capital = newCap;

                // if target was a troop, set alive to false
                } else if (target.entity.id == "troop") {
                    target.entity.alive = false;
                }
                target.entity = null;
            }

            // remove target from array of cells
            for (var i = this.cells.length-1; i >= 0; i--) {
                if (this.cells[i] == target) {
                    this.cells.splice(i, 1);
                }
            }

            // reassign region cells (some may have been severed)
            var test = this.cells.slice();
            this.cells = [this.capital];
            this.troops = [];

            for (var i = 0; i < test.length; i++) {
                test[i].region = null;
            }

            this.capital.region = this;

            // if capital is last cell in region, destroy it, otherwise, add connected cells
            if (this.capital.isolated()) {
                this.capital.entity = null;
                this.capital.region = null;
                this.alive = false;
            } else {
                this.addConnected();
            }

            // cells without regions in test have been severed, create new regions until each cell is assigned
            var master;
            for (var i = 0; i < test.length; i++) {
                master = test[i];
                if (master.isolated()) {
                    if (master.entity && master.entity.id == "troop") {
                        master.entity.alive = false;
                        master.entity = null;
                    }
                } else if (!master.region) {
                    master.player.regions.push(new this.region(nextRegion++, master, 0));
                    master.region.addConnected();
                }
            }
        };

        // find all regionless cells connected to capital and add to region
        this.addConnected = function() {
            var search = this.capital;
            var adj = [];
            var connected = [];
            var test;
            var run = true;
            while (run) {
                adj = search.findAdj();
                for (var i = 0; i < adj.length; i++) {
                    test = adj[i];
                    if (test.player == this.player && !test.region) {
                        test.region = this;
                        this.cells.push(test);
                        connected.push(test);
                        if (test.entity && test.entity.id == "troop") {
                            this.troops.push(test.entity);
                        }
                    }
                }

                if (connected.length == 0) {
                    run = false;
                }
                search = connected.pop();
            }
        };

        // absorb target friendly region into this region
        this.absorb = function(target) {
            this.capital.entity.bank += target.capital.entity.bank;
            this.troops = this.troops.concat(target.troops);
            for (var i = 0; i < target.cells.length; i++) {
                target.cells[i].region = this;
                this.cells.push(target.cells[i]);
            }
            target.capital.entity = null;
            target.alive = false;
        };

        // absorb target cell into this region
        this.addCell = function(target) {
            target.player = this.player;
            target.region = this;
            this.cells.push(target);
        };
    },

    create: function(map, size, fill, players) {
        map.size = size;
        map.fill = fill;
        map.cells = null;
        map.cellCount = 0;
        map.island = [];
        map.selected = null;
        map.cells = [];
        map.cellCount = (map.size * map.size) - (2 * (((map.size-1)/2) * ((((map.size-1)/2)+1)/2)));

        // build 2D array
        for (var x=0; x<map.size; x++) {
            map.cells[x] = [];
            for (var y=0; y<map.size; y++) {
                if (Math.abs(x-y) > map.size/2) {
                    map.cells[x][y] = null;
                } else {
                    map.cells[x][y] = new this.cell(x, y);
                }
            }
        }

        // assign cells to players
        // x and y values to attempt to fill in map, starts in center
        var xTest = Math.floor(map.size/2);
        var yTest = Math.floor(map.size/2);

        // iterating vars (island and player)
        var isIt = 0;
        var pIt = 0;

        var nextPlayer = false;
        var direction;

        // number of cells to fill
        var toFill = (map.cellCount * map.fill) - ((map.cellCount * map.fill) % (players.length));
        while (toFill > 0) {
            // move in a random direction
            direction = adjacent[Math.floor((Math.random()*adjacent.length))];
            xTest += direction.x;
            yTest += direction.y;
            // if cell available: claim, add to island, decrease toFill and move to next player
            if (map.cells[xTest] && map.cells[xTest][yTest] && !map.cells[xTest][yTest].player) {
                map.cells[xTest][yTest].player = players[pIt];
                map.island.push(map.cells[xTest][yTest]);
                toFill--;
                if (nextPlayer) {
                    pIt++;
                } else {
                    nextPlayer = true;
                }
                if (pIt >= players.length) {
                    pIt = 0;
                }
            }
            // move to newly claimed cell, or to beginning of list
            isIt++;
            if (isIt >= map.island.length) {
                isIt = 0;
            }
            xTest = map.island[isIt].x;
            yTest = map.island[isIt].y;
        }

        // assign cells to regions
        var test;
        for (var i = 0; i < map.island.length; i++) {
            test = map.island[i];
            if (!test.region && !test.isolated(map)) {
                test.player.regions.push(new this.region(nextRegion++, test, 10));
                test.region.addConnected();
            }
        }
    }
};
