//Room----------------------------------------
if(Room.prototype.sources == null){
    Object.defineProperty(Room.prototype, "sources", {
        get(){
            if(this._sources == null){
                this._sources = this.find(FIND_SOURCES);
            }

            return this._sources;
        }
    })
}

if(Room.prototype.towers == null){
    Object.defineProperty(Room.prototype, "towers", {
        get(){
            if(this._towers == null){
                this._towers = this.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER});
            }

            return this._towers;
        }
    })
}

if(Room.prototype.enemies == null){
    Object.defineProperty(Room.prototype, "enemies", {
        get(){
            if(this._enemies == null){
                this._enemies = this.find(FIND_HOSTILE_CREEPS, {filter: (c) => Memory.friends.indexOf(c.owner.username) == -1});
            }

            return this._enemies;
        }
    })
}

if(Room.prototype.enemiesStructures == null){
    Object.defineProperty(Room.prototype, "enemiesStructures", {
        get(){
            if(this._enemiesStructures == null){
                this._enemiesStructures = this.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => Memory.friends.indexOf(s.owner.username) == -1});
            }

            return this._enemiesStructures;
        }
    });
}
//RoomPosition--------------------------------
if(RoomPosition.prototype.findNearest == null){
    RoomPosition.prototype.findNearest = function(targets){
        let minDistance = 1000;
        let found;
        for(const target of targets){
            let distance = this.getRangeTo(target);
            if(distance < minDistance){
                minDistance = distance;
                found = target;
            }
        }

        return found;
    }
}
//Creep---------------------------------------
if(Creep.prototype.hasRole == null){
    Creep.prototype.hasRole = function(role){
        const creep = this;
        return {do: function(callback){callback(creep)}};
    }
}

if(Creep.prototype._harvest == null){
    Creep.prototype._harvest = Creep.prototype.harvest;
    Creep.prototype.harvest = function(target){
        if(target == null) return ERR_INVALID_ARGS;

        let resourceType;
        if(target.mineralType != null) resourceType = target.mineralType;
        else if(target.depositType != null) resourceType = target.depositType;
        else resourceType = RESOURCE_ENERGY;

        if(this.store.getFreeCapacity(resourceType) == 0) return ERR_FULL;
        return this._harvest(target);
    }
}

if(Creep.prototype.spawner == null){
    Object.defineProperty(Creep.prototype, "spawner", {
        get(){
            if(this._spawner == null){
                this._spawner = Game.spawns[this.memory.spawnName];
            }

            return this._spawner;
        },
        set(spawn){
            this.memory.spawnName = spawn.name;
        }
    })
}

if(Creep.prototype.isWaiting == null){
    Object.defineProperty(Creep.prototype, "isWaiting", {
        get(){
            return this.memory.waitTo > Game.time;
        }
    });
}

if(Creep.prototype.wait == null){
    Creep.prototype.wait = function(val){
        if(val == null || val < 0) return;
        this.memory.waitTo = Game.time + val;
    }
}

if(Creep.prototype._moveTo == null){
    Creep.prototype._moveTo = Creep.prototype.moveTo;
    Creep.prototype.moveTo = function(firstArg, secondArg, thirdArg){
        let visualizePathStyle;
        let reusePath = this.pos.getRangeTo(firstArg);
        if(Memory.debug && Memory.debug.path){
            visualizePathStyle = {opacity: .2};
        }

        if(Memory.debug && Memory.debug.target){
            let room;
            if(firstArg.room == null){
                room = firstArg.roomName;
            }else{
                room = firstArg.room.name;
            }

            if(this.room.name == room){
                this.room.visual.line(this.pos, firstArg);
            }else{
                this.room.visual.text(room, this.pos.x+1, this.pos.y, {font: 0.5})
            }
        }

        if(firstArg instanceof Object){
            secondArg = Object.assign({}, secondArg, {
                visualizePathStyle: visualizePathStyle,
                reusePath: reusePath
            });
            this._moveTo(firstArg, secondArg, thirdArg);
        }else{
            thirdArg = Object.assign({}, secondArg, {
                visualizePathStyle: visualizePathStyle,
                reusePath: reusePath
            });
            this._moveTo(firstArg, secondArg, thirdArg);
        }
    }
}

if(Creep.prototype.count == null){
    Creep.prototype.count = function(){
        Memory.counter[this.memory.role] += 1;
    }
}
//Structure-----------------------------------
if(Structure.prototype.isBroken == null){//<-- not working. returned undefined (trace not showed)
    Object.defineProperty(Structure.prototype, "isBroken", {
        isBroken: {
            get(){
                return this.hits < this.hitsMax;
            }
        }
    })
}
//StructureSpawn------------------------------
if(StructureSpawn.prototype.creepCounter == null){
    Object.defineProperty(StructureSpawn.prototype, "creepCounter", {
        add(creep){
            const role = creep.memory.role;
            if(role == null) return;

            if(this.memory.creepCounter == null){
                this.memory.creepCounter = {};
                this.memory.creepCounter[role] = 0;
            }

            this.memory.creepCounter[role]++;
        },
        // get(role){
        //     return this.memory.creepCounter[role];
        // },
        reset(){
            delete this.memory.creepCounter;
        }
    })
}

if(StructureSpawn.prototype.spawnRole == null){
    StructureSpawn.prototype.spawnRole = function(role, prefix){
        if(Memory.counter[role] > Memory[role].max){
            return;
        }

        let body = Memory[role].bodies["min"];
        if(Memory.counter[role] > 0 && !Memory[role].min){
            for(cost in Memory[role].bodies){
                if(body == null || (cost > body.cost && cost < this.room.energyCapacityAvailable)){
                    body = Memory[role].bodies[cost];
                }
            }
        }

        if(Memory.debug.spawn){
            this.room.visual.clear();
            this.room.visual.text(role+" "+body.cost, this.pos.x, this.pos.y-1);
            spawn.room.visual.text(spawn.room.energyAvailable, spawn.pos.x+0.4, spawn.pos.y+1.3, {font: 0.5, color: "#f5ef42"});
        }

        this.spawnCreep(body, prefix+Math.floor(Math.random() * 100), {memory: Object.assign({}, Memory[role].memory, {spawnName: this.name})});
        delete Memory.counter[role];
    }
}
