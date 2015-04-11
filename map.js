module.exports = {
    create: function(size, fill, players) {
        var map = {};
        map.size = size;
        map.fill = fill;
        map.cellCount = 0;
        map.island = [];
        map.cells = [];
        map.cellCount = (map.size * map.size) - (2 * (((map.size-1)/2) * ((((map.size-1)/2)+1)/2)));
        map.origin = Math.ceil(map.size/2);
        map.nextRegion = 0;
        map.adjacent = [
            {x:  0, y: -1}, //N
            {x:  1, y: -1}, //NE
            {x:  1, y:  0}, //SE
            {x:  0, y:  1}, //S
            {x: -1, y:  1}, //SW
            {x: -1, y:  0}  //SE
        ];

        map.get = function() {
            var output = [];
            var cell, entity;
            for(var x=0; x<map.size; x++) {
                output[x] = [];
                for(var y=0; y<map.size; y++) {
                    cell = map.cells[x][y];
                    if(cell) {
                        if(cell.entity) {
                            entity = {id: cell.entity.id};
                            switch(cell.entity.id) {
                                case 'village':
                                    entity.bank = cell.entity.bank
                                    break;
                                case 'troop':
                                    entity.strength = cell.entity.strength;
                                    entity.ready = cell.entity.ready;
                                    break;
                            }
                        } else {
                            entity = null;
                        }
                        output[x][y] = {
                            x: x,
                            y: y,
                            entity: entity,
                            player: cell.player.id
                        };
                    } else {
                        output[x][y] = null;
                    }
                }
            }
            return output;
        };

        map.cell = function(x, y) {
            this.x = x;
            this.y = y;
            this.player;
            this.entity = null;
            this.region = null;

            // return a list of adjacent cells (including enemy cells, but not empty cells)
            this.findAdj = function() {
                var adj = map.adjacent;
                var result = [];
                var xTest, yTest;
                for(var i=0; i<adj.length; i++) {
                    xTest = this.x + adj[i].x;
                    yTest = this.y + adj[i].y;
                    if (map.cells[xTest] && map.cells[xTest][yTest]) {
                        result.push(map.cells[xTest][yTest]);
                    }
                }
                return result;
            };

            // return true if test is adjacent to this cell, otherwise false
            this.isAdj = function(test) {
                var adj = map.adjacent;
                for(var i=0; i<adj.length; i++) {
                    if(this.x + adj[i].x == test.x && this.y + adj[i].y == test.y) {
                        return true;
                    }
                }
                return false;
            };

            // if adjacent to at least one friendly cell, return false, otherwise true
            this.isolated = function() {
                var neighbors = this.findAdj();
                for(var i=0; i<neighbors.length; i++) {
                    if(neighbors[i].player == this.player) {
                        return false;
                    }
                }
                return true;
            };

            // add new troop or upgrade existing troop
            this.buyTroop = function() {
                var troops = this.player.troops;
                var village = this.region.capital.entity;
                if(village.bank >= 10) {
                    if(!this.entity) {
                        troops.push(new map.troop(this));
                        village.bank -= 10;
                    } else if(this.entity.id == "troop" && this.entity.strength < 4) {
                        this.entity.strength++;
                        village.bank -= 10;
                    }
                }
            };

            // add tower
            this.buyTower = function() {
                if(!this.entity && this.region.capital.entity.bank >= 15) {
                    this.entity = new map.tower();
                    this.region.capital.entity.bank -= 15;
                }
            };

            // return true if move successful, otherwise false
            this.moveTroop = function(target) {
                // if target isn't this cell and troop has not moved this turn...
                if(target != this && this.entity && this.entity.ready) {
                    // ...and target is part of the same region...
                    if(target.region == this.region) {
                        // ...and target is empty, free move
                        if(!target.entity) {
                            target.entity = this.entity;
                            target.entity.cell = target;
                            this.entity = null;
                            return true;
                            // ...and target is also a troop, attempt to combine
                        } else if(target.entity.id == "troop" && target.entity.strength + this.entity.strength <= 4) {
                            target.entity.strength += this.entity.strength;
                            this.entity.alive = false;
                            this.entity = null;
                            return true;
                        } else {
                            return false;
                        }
                        // ...and target is adjacent to this region, and has a lower defense than this troop strength
                    } else if(this.region.adj(target) && target.defend() < this.entity.strength) {
                        this.attack(target);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            };

            this.attack = function(d) {
                if(d.region) {
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
                for(var i=0; i<neighbors.length; i++) {
                    var test = neighbors[i];
                    if(test.player == this.player) {
                        if(!test.region) {
                            this.region.addCell(test);
                        } else if(test.region != this.region) {
                            this.region.absorb(test.region);
                        }
                    }
                }
            };

            // check strength of this and adjacent cells, return highest value
            this.defend = function() {
                var neighbors = this.findAdj();
                var defense = 0;
                var strength, test;
                if(this.entity) {
                    defense = this.entity.strength;
                }
                for(var i=0; i<neighbors.length; i++) {
                    test = neighbors[i];
                    if(test.player == this.player && test.entity) {
                        strength = test.entity.strength;
                        if(strength > defense) {
                            defense = strength;
                        }
                    }
                }
                return defense;
            };
        };

        map.region = function(cell, bank) {
            this.id = "region";
            this.num = map.nextRegion++;
            this.alive = true;
            this.player = cell.player;
            this.capital = cell;
            this.cells = [];
            this.troops = [];

            cell.region = this;
            cell.entity = new map.village(this, bank);
            this.cells.push(cell);

            this.updateTroops = function() {
                // remove dead troops
                for(var i=this.troops.length-1; i>=0; i--) {
                    if(this.troops[i].alive == false) {
                        this.troops.splice(i, 1);
                    }
                }
                // set all troops to ready
                for(var i=0; i<this.troops.length; i++) {
                    this.troops[i].ready = true;
                }
            };

            // collect income from each cell in region
            this.tax = function() {
                this.capital.entity.bank += this.cells.length*2;
            };

            this.spend = function() {
                var cell;
                for(var i=0; i<this.cells.length; i++) {
                    cell = this.cells[i];
                    if(cell.entity && cell.entity.id == "troop") {
                        switch(cell.entity.strength) {
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
                        if(this.capital.entity.bank < 0) {
                            this.capital.entity.bank = 0;
                            this.starve();
                            return;
                        }
                    }
                }
            };

            this.starve = function() {
                var cell;
                for(var i=0; i<this.cells.length; i++) {
                    cell = this.cells[i];
                    if(cell.entity && cell.entity.id == "troop") {
                        cell.entity.alive = false;
                        cell.entity = null;
                    }
                }
                this.troops = [];
            };

            // return true if passed cell is adjacent to any cell in this region
            this.adj = function(test) {
                neighbors = test.findAdj();
                for(var i=0; i<neighbors.length; i++) {
                    if(neighbors[i].region == this) {
                        return true;
                    }
                }
                return false;
            };

            this.dropCell = function(target) {
                target.player = 0;
                target.region = null;
                if(target.entity) {
                    // if target was the capital, choose a new capital for the region
                    if(target.entity.id == "village") {
                        var test, newCap;
                        for(var i=0; i<this.cells.length; i++) {
                            test = this.cells[i];
                            if(!test.entity) {
                                newCap = test;
                                break;
                            } else if(test.entity.id == "tower") {
                                newCap = test;
                            } else if(!newCap || (newCap.entity.id != "tower" && test.entity.strength < newCap.entity.strength)) {
                                newCap = test;
                            }
                        }
                        if(newCap.entity && newCap.entity.id == "troop") {
                            newCap.entity.alive = false;
                        }
                        newCap.entity = new map.village(this, 0);
                        this.capital = newCap;

                    // if target was a troop, set alive to false
                    } else if(target.entity.id == "troop") {
                        target.entity.alive = false;
                    }
                    target.entity = null;
                }

                // remove target from array of cells
                for(var i=this.cells.length-1; i>=0; i--) {
                    if(this.cells[i] == target) {
                        this.cells.splice(i, 1);
                    }
                }

                // reassign region cells (some may have been severed)
                var test = this.cells.slice();
                this.cells = [this.capital];
                this.troops = [];

                for(var i=0; i<test.length; i++) {
                    test[i].region = null;
                }

                this.capital.region = this;

                // if capital is last cell in region, destroy it, otherwise, add connected cells
                if(this.capital.isolated()) {
                    this.capital.entity = null;
                    this.capital.region = null;
                    this.alive = false;
                } else {
                    this.addConnected();
                }

                // cells without regions in test have been severed, create new regions until each cell is assigned
                var master;
                for(var i=0; i<test.length; i++) {
                    master = test[i];
                    if(master.isolated()) {
                        if(master.entity && master.entity.id == "troop") {
                            master.entity.alive = false;
                            master.entity = null;
                        }
                    } else if(!master.region) {
                        master.player.regions.push(new map.region(master, 0));
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
                while(run) {
                    adj = search.findAdj();
                    for(var i=0; i<adj.length; i++) {
                        test = adj[i];
                        if(test.player == this.player && !test.region) {
                            test.region = this;
                            this.cells.push(test);
                            connected.push(test);
                            if(test.entity && test.entity.id == "troop") {
                                this.troops.push(test.entity);
                            }
                        }
                    }

                    if(connected.length == 0) {
                        run = false;
                    }
                    search = connected.pop();
                }
            };

            // absorb target friendly region into this region
            this.absorb = function(target) {
                this.capital.entity.bank += target.capital.entity.bank;
                this.troops = this.troops.concat(target.troops);
                for(var i=0; i<target.cells.length; i++) {
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
        };

        map.village = function(region, bank) {
            this.id = "village";
            this.region = region;
            this.bank = bank;
            this.strength = 1;
        };

        map.troop = function(cell) {
            this.id = "troop";
            this.cell = cell;
            this.strength = 1;
            this.alive = true;
            this.ready = true;

            cell.entity = this;
            cell.region.troops.push(this);
        };

        map.tower = function() {
            this.id = "tower";
            this.strength = 2;
        };

        // build 2D array
        console.log('building map array');
        for(var x=0; x<map.size; x++) {
            map.cells[x] = [];
            for(var y=0; y<map.size; y++) {
                // null out corners of array to leave hexagon-shaped map
                if(x+y < map.origin || x+y >= (map.size*2)-map.origin) {
                    map.cells[x][y] = null;
                } else {
                    map.cells[x][y] = new map.cell(x, y);
                }
            }
        }

        // assign cells to players
        console.log('assigning cells to players');
        // x and y values to attempt to fill in map, starts in center
        var xTest = Math.floor(map.size/2);
        var yTest = Math.floor(map.size/2);

        // iterating vars (island and player)
        var isIt = 0;
        var pIt = 0;

        var nextPlayer = false;
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

        // remove unclaimed cells
        console.log('removing unclaimed cells');
        var cell;
        for(var x=0; x<map.size; x++) {
            for(var y=0; y<map.size; y++) {
                cell = map.cells[x][y];
                if(cell && !cell.player) {
                    map.cells[x][y] = null;
                }
            }
        }

        // assign cells to regions
        console.log('assigning cells to regions');
        var test;
        for(var i=0; i<map.island.length; i++) {
            test = map.island[i];
            if(!test.region && !test.isolated(map)) {
                test.player.regions.push(new map.region(test, 0));
                test.region.addConnected();
            }
        }

        return map;
    }
};
