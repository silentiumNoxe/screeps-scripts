require("prototypes");

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
    if(creep.ticksToLive < 500){
        const spawn = creep.spawn;
        if(spawn == null) return true;//continue?
        if(spawn.memory.renew == null) spawn.memory.renew = creep.id;
        if(creep.id != spawn.memory.renew) return true;//continue?

        if(creep.spawn.store[RESOURCE_ENERGY] > 100 && creep.spawn.room.name == creep.room.name){
            creep.say("♻️", true);
            let status = creep.spawn.renewCreep(creep);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.spawn);
            }else if(status == ERR_FULL){
                spawn.memory.renew = null;
            }
            return false;//continue?
        }
    }

    return true;//continue?
}

module.exports.loop = () => {
    initMemory();

    const counter = {
        harvester: 0,
        ucl: 0,
        builder: 0,
        carry: 0
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
            });
        });

    Object.keys(Game.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];
            if(creep == null){
                delete Memory.creeps[name];
                return;
            }

            if(creep.memory.spawning) return;

            if(!renew(creep)) return;

            if(creep.isWaiting){
                creep.say("😴", true);
                return;
            }

            if(creep.hasRole(Creep.ROLE_HARVESTER)){
                counter.harvester++;

                if(creep.memory.todo == "transfer"){
                    if(creep.room.name != Game.spawns.Spawn1.room.name){
                        creep.moveTo(Game.spawns.Spawn1);
                        return;
                    }
                    let target = Game.getObjectById(creep.memory.target);
                    if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                        creep.say("👀", true);
                        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                    }
                    if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                        creep.say("👀", true);
                        if(creep.spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                            target = creep.spawn;
                        }
                    }
                    if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                        creep.say("👀", true);
                        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if( s.structureType == STRUCTURE_EXTENSION ||
                                s.structureType == STRUCTURE_CONTAINER ||
                                s.structureType == STRUCTURE_STORAGE){
                                    return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                                }
                        }});
                    }
                    if(target == null){
                        creep.wait(50);
                        return;
                    }
                    if(target.structureType == STRUCTURE_STORAGE) creep.memory.target = null
                    else creep.memory.target = target.id;
                    let status = creep.transfer(target, RESOURCE_ENERGY);
                    if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.todo = "harvest";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    else if(status == OK) creep.say("👆", true);
                }

                if(creep.memory.todo == "harvest"){
                    let target = creep.pos.findClosestByPath(creep.room.sources);
                    if(target == null){
                        creep.moveTo(new RoomPosition(0, 26, "E9N23"));
                    }
                    let status = creep.harvest(target);
                    if(status == ERR_FULL){
                        let containers = creep.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                        if(containers.length > 0){
                            creep.transfer(containers[0], RESOURCE_ENERGY);
                        }else{
                            creep.memory.todo = "transfer";
                        }
                    }
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }
            }else if(creep.hasRole(Creep.ROLE_UCL)){
                counter.ucl++;

                if(creep.memory.todo == "energy"){
                    let target = Game.getObjectById(creep.memory.energy);
                    if(target == null || target.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY)){
                        creep.say("👀", true);
                        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                                return s.store[RESOURCE_ENERGY] > 0;
                            }
                        }});
                    }
                    if(target == null){
                        creep.wait(200);
                        return;
                    }

                    creep.memory.energy = target.id;
                    let status = creep.withdraw(target, RESOURCE_ENERGY);
                    if(status == ERR_FULL || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) creep.memory.todo = "upgrade";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    else if(status = OK) creep.say("👇", true);
                }

                if(creep.memory.todo == "upgrade"){
                    let target = creep.room.controller;
                    if(!creep.pos.isNearTo(target))
                        creep.moveTo(target, {visualizePathStyle: {}});// OPTIMIZE: reusePath, ignoreCreeps
                    let status = creep.upgradeController(target);
                    if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                }
            }else if(creep.hasRole(Creep.ROLE_BUILDER)){
                counter.builder++;

                if(creep.memory.todo == "energy"){
                    let target = Game.getObjectById(creep.memory.energy);
                    if(target == null || target.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY)){
                        creep.say("👀", true);
                        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                                return s.store[RESOURCE_ENERGY] > 0;
                            }
                        }});
                    }

                    if(target == null){
                        creep.wait(200);
                        return;
                    }

                    creep.memory.energy = target.id;
                    let status = creep.withdraw(target, RESOURCE_ENERGY);
                    if(status == ERR_FULL || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) creep.memory.todo = "repair";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    else if(status = OK) creep.say("👇", true);
                }

                if(creep.memory.todo == "repair"){
                    let target = Game.getObjectById(creep.memory.target);
                    if(target == null || target.hits == target.hitsMax){
                        creep.say("👀", true);
                        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                            if(s.structureType == STRUCTURE_RAMPART) return s.hits < 1000000;
                            return s.structureType != STRUCTURE_WALL && s.hits < s.hitsMax;
                        }});
                    }
                    if(target != null){
                        creep.say("️🔧", true);
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
                        creep.say("👀", true);
                        target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                    }
                    if(target != null){
                        creep.say("🛠", true);
                        creep.memory.target = target.id;
                        let status = creep.build(target);
                        if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                        else if(status == ERR_INVALID_TARGET) creep.memory.target = null;
                    }else{
                        creep.memory.todo = "repair";
                    }
                }
            }//builder
        });//forEach

    let containers = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {filter: (s) => {
        if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
            return s.store[RESOURCE_ENERGY] > 0;
        }
    }});
    if(counter.harvester < Memory.maxHarvesters){
        Game.spawns.Spawn1.room.visual.text("harvester", 32, 19);
        Game.spawns.Spawn1.spawnCreep(Memory.bodyHarvester, "H-"+Math.floor(Math.random()*100), {memory:{role: "harvester", todo: "harvest", waitTo: 0, spawnName: "Spawn1"}});
    }else if(counter.ucl < Memory.maxUcls){
        if(containers.length > 0){
            Game.spawns.Spawn1.room.visual.text("ucl", 32, 19);
            Game.spawns.Spawn1.spawnCreep(Memory.bodyUcl, "C-"+Math.floor(Math.random()*100), {memory:{role: "ucl", todo: "energy", waitTo: 0, spawnName: "Spawn1"}});
        }
    }else if(counter.builder < Memory.maxBuilders){
        if(containers.length > 0){
            Game.spawns.Spawn1.room.visual.text("builder", 32, 19);
            Game.spawns.Spawn1.spawnCreep(Memory.bodyBuilder, "B-"+Math.floor(Math.random()*100), {memory:{role: "builder", todo: "energy", waitTo: 0, spawnName: "Spawn1"}});
        }
    }

    if(Game.cpu.getUsed() > Game.cpu.limit){
        Game.notify("Used "+usedCpu+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket+"(creeps: "+Object.keys(Game.creeps).length+")");
    }
}
