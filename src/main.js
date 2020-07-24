require("memory_init");
require("prototypes");

function renew(creep){
    if(creep.spawner == null) creep.memory.spawnName = Object.keys[Game.spawns][0];
    if(creep.ticksToLive < 500){
        const spawn = creep.spawner;
        if(spawn == null) return true;//continue?
        if(spawn.memory.renew == null) spawn.memory.renew = creep.id;
        if(creep.id != spawn.memory.renew) return true;//continue?

        if(creep.spawner.store[RESOURCE_ENERGY] > 100 && creep.spawner.room.name == creep.room.name){
            creep.say("♻️", true);
            let status = creep.spawner.renewCreep(creep);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.spawner);
            }else if(status == ERR_FULL){
                spawn.memory.renew = null;
            }
            return false;//continue?
        }
    }

    return true;//continue?
}

module.exports.loop = () => {
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

            creep.spawner.creepCounter.add(creep);

            if(creep.memory.spawning) return;

            if(!renew(creep)) return;

            if(creep.isWaiting){
                creep.say("😴", true);
                return;
            }

            if(creep.hasRole(Creep.ROLE_HARVESTER)){
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
                        if(creep.spawner.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                            target = creep.spawner;
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
                        creep.say("🔨", true);
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

    Object.keys(Game.spawns)
        .forEach(name => {
            const spawn = Game.spawns[name];
            if(spawn == null) return;
            
            if(spawn.creepCounter.get(Creep.ROLE_HARVESTER) < Memory.harvester.max){
                Game.spawns.Spawn1.room.visual.text("<- "+Creep.ROLE_HARVESTER, spawn.pos.x+2, spawn.pos.y);
                spawn.spawnCreep(Memory.harvester.bodies["min"], "H-"+rand(100), {memory: Object.assign(Memory.harvester.memory, {spawnName: spawn.name})});
                return;
            }
            if(spawn.creepCounter.get(Creep.ROLE_UCL) < Memory.ucl.max){
                Game.spawns.Spawn1.room.visual.text("<- "+Creep.ROLE_UCL, spawn.pos.x+2, spawn.pos.y);
                spawn.spawnCreep(Memory.ucl.bodies["min"], "C-"+rand(100), {memory: Object.assign(Memory.harvester.memory, {spawnName: spawn.name})});
                return;
            }
            if(spawn.creepCounter.get(Creep.ROLE_BUILDER) < Memory.builder.max){
                Game.spawns.Spawn1.room.visual.text("<- "+Creep.ROLE_BUILDER, spawn.pos.x+2, spawn.pos.y);
                spawn.spawnCreep(Memory.builder.bodies["min"], "B-"+rand(100), {memory: Object.assign(Memory.harvester.memory, {spawnName: spawn.name})});
                return;
            }
        });



    if(Game.cpu.getUsed() > Game.cpu.limit){
        Game.notify("Used "+usedCpu+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket+"(creeps: "+Object.keys(Game.creeps).length+")");
    }
}

function rand(max){
    return Math.floor(Math.random()*max);
}
