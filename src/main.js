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
                this._enemies = this.find(FIND_HOSTILE_CREEPS);
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
//Structure-----------------------------------
if(Structure.prototype.isBroken == null){
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
                    Game.notify("In the room "+tower.room.name+" tower found enemies");
                    let status = tower.attack(tower.pos.findNearest(tower.room.enemies));
                    if(status == ERR_NOT_ENOUGH_ENERGY){
                        Game.notify("Tower ["+tower.room.name+"] can't attack because does not have energy");
                    }
                }
            })
        });

    Object.keys(Memory.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];
            if(creep == null){
                delete Memory.creeps[name];
                return;
            }

            if(creep.hasRole("harvester")){
                counter.harvester++;

                if(creep.memory.waitTo < Game.time){
                    if(creep.memory.todo == "transfer"){
                        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if(s.structureType == STRUCTURE_CONTAINER ||
                                s.structureType == STRUCTURE_STORAGE ||
                                s.structureType == STRUCTURE_TOWER ||
                                s.structureType == STRUCTURE_SPAWN ||
                                s.structureType == STRUCTURE_EXTENSION){

                                return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                            }
                        }});
                        if(target == null){
                            creep.say("waiting");
                            creep.memory.waitTo = Game.time+50;
                        }
                        let status = creep.transfer(target, RESOURCE_ENERGY);
                        if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.todo = "harvest";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    }
                }

                if(creep.memory.todo = "harvest"){
                    let target = creep.pos.findClosestByPath(creep.room.sources);
                    let status = creep.harvest(target);
                    if(status == ERR_FULL) creep.memory.todo = "transfer";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }
            }else if(creep.hasRole("ucl")){
                counter.ucl++;

                if(creep.memory.waitTo < Game.time){
                    if(creep.memory.todo == "energy"){
                        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                                return s.store[RESOURCE_ENERGY] > 0;
                            }
                        }});
                        if(target == null){
                            creep.say("waiting");
                            creep.memory.waitTo = Game.time+50;
                        }
                        let status = creep.withdraw(target, RESOURCE_ENERGY);
                        if(status == ERR_FULL) creep.memory.todo = "upgrade";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    }

                    if(creep.memory.todo == "upgrade"){
                        let target = creep.room.controller;
                        creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                        let status = creep.upgradeController(target);
                        if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                    }
                }
            }else if(creep.hasRole("builder")){
                counter.builder++;

                if(creep.memory.waitTo < Game.time){
                    if(creep.memory.todo == "energy"){
                        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                                return s.store[RESOURCE_ENERGY] > 0;
                            }
                        }});
                        if(target == null){
                            creep.say("waiting");
                            creep.memory.waitTo = Game.time+100;
                        }
                        let status = creep.withdraw(target, RESOURCE_ENERGY);
                        if(status == ERR_FULL) creep.memory.todo = "repair";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    }

                    if(creep.memory.todo == "repair"){
                        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.isBroken});
                        if(target != null){
                            let status = creep.repair(target);
                            if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                        }else{
                            creep.memory.todo = "build";
                        }
                    }

                    if(creep.memory.todo == "build"){
                        let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                        if(target != null){
                            let status = creep.build(target);
                            if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                        }else{
                            creep.memory.todo = "repair";
                        }
                    }
                }
            }//builder
        });//forEach

    if(counter.harvester < Memory.maxHarvesters){
        Game.spawns.Spawn1.spawnCreep(Memory.bodyHarvester, "H-"+Math.floor(Math.random()*100), {memory:{role: "harvester", todo: "harvest", spawnName: "Spawn1"}});
    }else if(counter.ucl < Memory.maxUcls){
        Game.spawns.Spawn1.spawnCreep(Memory.bodyUcl, "C-"+Math.floor(Math.random()*100), {memory:{role: "ucl", todo: "energy", spawnName: "Spawn1"}});
    }else if(counter.builder < Memory.maxBuilders){
        Game.spawns.Spawn1.spawnCreep(Memory.bodyBuilder, "B-"+Math.floor(Math.random()*100), {memory:{role: "builder", todo: "energy", spawnName: "Spawn1"}});
    }

    const endCpu = Game.cpu.getUsed();
    const usedCpu = endCpu - startCpu;
    if(usedCpu > Game.cpu.limit){
        Game.notify("Used "+usedCpu+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket);
    }
}
