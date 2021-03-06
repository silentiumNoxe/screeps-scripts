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
//Creep---------------------------------------\


if(Creep.prototype.hasRole == null){
    Creep.prototype.hasRole = function(role){
        if(this.memory.roles == null) this.memory.roles = [];
        return this.memory.roles.indexOf(role) > -1;
    }
}

if(Creep.prototype._harvest == null){
    Creep.prototype._harvest = Creep.prototype.harvest;
    Creep.prototype.harvest = function(target){
        if(!(this.hasRole(Creep.ROLE_HARVESTER))) return ERR_ROLE;
        if(this.getActiveBodyparts(WORK) == 0) return ERR_NO_BODYPART;
        if(target == null) return ERR_INVALID_ARGS;

        if(target.find != null){
            target = this.pos.findClosestByPath(target.find, target.opts);
        }

        if(target == null) return ERR_NOT_FOUND;

        let resourceType;
        if(target.mineralType != null) resourceType = target.mineralType;
        else if(target.depositType != null) resourceType = target.depositType;
        else resourceType = RESOURCE_ENERGY;

        if(this.store.getFreeCapacity(resourceType) == 0) return ERR_FULL;

        if(!(this.pos.isNearTo(target))) this.moveTo(target);
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
        if(Memory.debug.path){
            visualizePathStyle = {opacity: .2};
        }

        if(Memory.debug.target){
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
                reusePath: reusePath,
                ignoreCreeps: false
            });
            this._moveTo(firstArg, secondArg, thirdArg);
        }else{
            thirdArg = Object.assign({}, secondArg, {
                visualizePathStyle: visualizePathStyle,
                reusePath: reusePath,
                ignoreCreeps: false
            });
            this._moveTo(firstArg, secondArg, thirdArg);
        }
    }
}

if(Creep.prototype.count == null){
    Creep.prototype.count = function(){
        if(Memory.counter[this.memory.role] == null) Memory.counter[this.memory.role] = 0;
        Memory.counter[this.memory.role]++;
    }
}

if(Creep.prototype.renew == null){
    /**
    @return {boolean} continue creep logic?
    */
    Creep.prototype.renew = function(){
        if(this.spawner == null) this.spawner = Object.keys(Game.spawns)[0];
        const spawn = this.spawner;
        if(spawn == null) return true;
        if(spawn.memory.waitTo > Game.time) return true;

        if((spawn.memory.renew == null || Game.creeps[spawn.memory.renew] == null) && this.ticksToLive < 500) spawn.memory.renew = this.name;
        if(this.name != spawn.memory.renew) return true;

        if(spawn.room.name == this.room.name){
            creep.say("♻️", true);
            let status = spawn.renewCreep(this);
            if(status == ERR_NOT_IN_RANGE){
                this.moveTo(spawn);
            }else if(status == ERR_FULL){
                spawn.memory.renew = null;
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                spawn.memory.waitTo = Game.time + 1000;
                return true;
            }
            return false;
        }
        return true;
    }
}

if(Creep.prototype.todo == null){
    Object.defineProperty(Creep.prototype, "todo", {
        get(){
            return this.memory.todo;
        },
        set(val){
            this.memory.todo = val;
        },
        resolve(todo, callback){
            if(this.todo.get() == todo){
                return callback(this);
            }
        }
    });
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
if(StructureSpawn.prototype.spawnRole == null){
    StructureSpawn.prototype.spawnRole = function(role, prefix){
        if(Memory.counter[role] != null && Memory.counter[role] > Memory[role].max){
            return true;//next
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
            this.room.visual.text(role+" "+body.cost, this.pos.x, this.pos.y-1);
            this.room.visual.text(this.room.energyAvailable, this.pos.x+0.4, this.pos.y+1.3, {font: 0.5, color: "#f5ef42"});
        }

        delete Memory.counter[role];
        let status = this.spawnCreep(body.value, prefix+Math.floor(Math.random() * 100), {memory: Object.assign({}, Memory[role].memory, {spawnName: this.name})});
        if(status == OK || status == ERR_NOT_ENOUGH_ENERGY || status == ERR_BUSY){
            return false;//next
        }
    }
}
