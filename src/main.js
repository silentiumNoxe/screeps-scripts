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
                this._enemies = this.find(FIND_HOSTILE_CREEPS, {filter: (c) => Memory.friends.indexOf(c.owner) == -1});
            }

            return this._enemies;
        }
    })
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
        return this.memory.role == role;
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

if(Creep.prototype.spawn == null){
    Object.defineProperty(Creep.prototype, "spawn", {
        get(){
            if(this._spawn == null){
                this._spawn = Game.spawns[this.memory.spawnName];
            }

            return this._spawn;
        }
    })
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
//main----------------------------------------
function initMemory(){
    if(Memory.maxHarvesters == null) Memory.maxHarvesters = 8;
    if(Memory.maxUcls == null) Memory.maxUcls = 6;
    if(Memory.maxBuilders == null) Memory.maxBuilders = 3;

    if(Memory.bodyHarvester == null) Memory.bodyHarvester = [WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
    if(Memory.bodyUcl == null) Memory.bodyUcl = [WORK, WORK, CARRY, MOVE];
    if(Memory.bodyBuilder == null) Memory.bodyBuilder = [WORK, WORK, CARRY, CARRY, MOVE];

    if(Memory.friends == null) Memory.friends = [];
}

function renew(creep){
    if(creep.spawn == null) creep.memory.spawnName = Object.keys[Game.spawns][0];
    if(creep.ticksToLive < 500 && creep.spawn.store[RESOURCE_ENERGY] > 100){
        creep.moveTo(creep.spawn);
        creep.spawn.renewCreep(creep);
        return false;//continue?
    }

    return true;//continue?
}

module.exports.loop = () => {
    const startCpu = Game.cpu.getUsed();

    initMemory();

    const counter = {
        harvester: 0,
        ucl: 0,
        builder: 0
    }

    Object.keys(Game.rooms)
        .forEach(name => {
            const room = Game.rooms[name];
            if(room == null) return;

            room.towers.forEach(tower => {
                if(!tower.my) return;

                if(tower.room.enemies.length > 0){
                    Game.notify("In the room "+tower.room.name+" tower found enemies", 20);
                    let status = tower.attack(tower.pos.findNearest(tower.room.enemies));
                    if(status == ERR_NOT_ENOUGH_ENERGY){
                        Game.notify("Tower ["+tower.room.name+"] can't attack because does not have energy", 5);
                    }
                }
            })
        });

    Object.keys(Game.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];
            if(creep == null){
                delete Memory.creeps[name];
                return;
            }

            if(creep.hasRole("harvester")){
                counter.harvester++;
                if(!renew(creep)) return;

                if(creep.memory.waitTo < Game.time){
                    if(creep.memory.todo == "transfer"){
                        if(creep.room.name != Game.spawns.Spawn1.room.name){
                            creep.moveTo(Game.spawns.Spawn1);
                            return;
                        }
                        let target = Game.getObjectById(creep.memory.target);
                        if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                        }
                        if(target == null){
                            if(creep.spawn != null && creep.spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                                target = creep.spawn;
                            }
                        }
                        if(target == null){
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                                if(s.structureType == STRUCTURE_CONTAINER ||
                                    s.structureType == STRUCTURE_STORAGE ||
                                    s.structureType == STRUCTURE_TOWER ||
                                    s.structureType == STRUCTURE_SPAWN ||
                                    s.structureType == STRUCTURE_EXTENSION){

                                    return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                                }
                            }});
                        }
                        if(target == null){
                            creep.say("waiting");
                            creep.memory.waitTo = Game.time+50;
                            return;
                        }
                        creep.memory.target = target.id;
                        let status = creep.transfer(target, RESOURCE_ENERGY);
                        if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.todo = "harvest";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    }
                }else{
                    creep.say("😴");
                }

                if(creep.memory.todo == "harvest"){
                    let target = creep.pos.findClosestByPath(creep.room.sources);
                    if(target == null){
                        creep.moveTo(new RoomPosition(0, 26, "E9N23"));
                    }
                    let status = creep.harvest(target);
                    if(status == ERR_FULL) creep.memory.todo = "transfer";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }
            }else if(creep.hasRole("ucl")){
                counter.ucl++;
                if(!renew(creep)) return;

                if(creep.memory.waitTo < Game.time){
                    if(creep.memory.todo == "energy"){
                        let target = Game.getObjectById(creep.memory.energy);
                        if(target == null || target.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY)){
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                                if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                                    return s.store[RESOURCE_ENERGY] > 0;
                                }
                            }});
                        }
                        if(target == null){
                            creep.memory.waitTo = Game.time+200;
                            return;
                        }

                        creep.memory.energy = target.id;
                        let status = creep.withdraw(target, RESOURCE_ENERGY);
                        if(status == ERR_FULL || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) creep.memory.todo = "upgrade";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    }

                    if(creep.memory.todo == "upgrade"){
                        let target = creep.room.controller;
                        if(!creep.pos.isNearTo(target))
                            creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                        let status = creep.upgradeController(target);
                        if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                    }
                }else{
                    creep.say("😴");
                }
            }else if(creep.hasRole("builder")){
                counter.builder++;
                if(!renew(creep)) return;

                if(creep.memory.waitTo < Game.time){
                    if(creep.memory.todo == "energy"){
                        let target = Game.getObjectById(creep.memory.energy);
                        if(target == null || target.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY)){
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                                if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                                    return s.store[RESOURCE_ENERGY] > 0;
                                }
                            }});
                        }

                        if(target == null){
                            creep.memory.waitTo = Game.time+200;
                            return;
                        }

                        creep.memory.energy = target.id;
                        let status = creep.withdraw(target, RESOURCE_ENERGY);
                        if(status == ERR_FULL || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) creep.memory.todo = "repair";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    }

                    if(creep.memory.todo == "repair"){
                        let target = Game.getObjectById(creep.memory.target);
                        if(target == null || target.hits == target.hitsMax){
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                                if(s.structureType == STRUCTURE_RAMPART) return s.hits < 1000000;
                                return s.structureType != STRUCTURE_WALL && s.hits < s.hitsMax;
                            }});
                        }
                        if(target != null){
                            creep.memory.target = target.id;
                            let status = creep.repair(target);
                            if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                        }else{
                            creep.memory.todo = "build";
                        }
                    }

                    if(creep.memory.todo == "build"){
                        let target = Game.getObjectById(creep.memory.target);
                        if(target == null){
                            target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                        }
                        if(target != null){
                            creep.memory.target = target.id;
                            let status = creep.build(target);
                            if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                            else if(status == ERR_INVALID_TARGET) creep.memory.target = null;
                        }else{
                            creep.memory.todo = "repair";
                        }
                    }
                }else{
                    creep.say("😴");
                }
            }//builder
        });//forEach

    let containers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {filter: (s) => {
        if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
            return s.store[RESOURCE_ENERGY] > 0;
        }
    }});
    if(counter.harvester < Memory.maxHarvesters){
        Game.spawns.Spawn1.spawnCreep(Memory.bodyHarvester, "H-"+Math.floor(Math.random()*100), {memory:{role: "harvester", todo: "harvest", waitTo: 0, spawnName: "Spawn1"}});
    }else if(counter.ucl < Memory.maxUcls){
        if(containers.length > 0){
            Game.spawns.Spawn1.spawnCreep(Memory.bodyUcl, "C-"+Math.floor(Math.random()*100), {memory:{role: "ucl", todo: "energy", waitTo: 0, spawnName: "Spawn1"}});
        }
    }else if(counter.builder < Memory.maxBuilders){
        if(containers.length > 0)
            Game.spawns.Spawn1.spawnCreep(Memory.bodyBuilder, "B-"+Math.floor(Math.random()*100), {memory:{role: "builder", todo: "energy", waitTo: 0, spawnName: "Spawn1"}});
    }

    const endCpu = Game.cpu.getUsed();
    const usedCpu = endCpu - startCpu;
    if(usedCpu > Game.cpu.limit){
        Game.notify("Used "+usedCpu+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket);
    }
}
