module.exports.loop = () => {
    let cpuStart = Game.cpu.getUsed();

    const debug = Memory.debug;

    processTowers();

    let harvesters = 0;
    let ucls = 0;
    let builders = 0;

    for (var creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        if(creep == null) delete Memory.creeps;

        harvesters += harvester(creep);
        ucls += ucl(creep);
        builders += builder(creep);
    }

    if(harvesters < 10){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "H"+Math.floor(Math.random()*100), {memory: {task: "harvest", spawnName: "Spawn1"}});
    }else if(ucls < 5){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "CL"+Math.floor(Math.random()*100), {memory: {task: "energy", spawnName: "Spawn1"}});
    }else if(builders < 3){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "B"+Math.floor(Math.random()*100), {memory: {task: "energy", spawnName: "Spawn1"}});
    }

    console.log("usage cpu:", (Game.cpu.getUsed() - cpuStart).toFixed(2), "bucket:", Game.cpu.bucket);
};

/** @param creep {Creep}*/
function harvester(creep){
    if(!creep.name.startsWith("H")) return 0;

    if(creep.memory.task == null) creep.memory.task = "harvest";

    let target, status;
    const spawn = Game.spawns[creep.memory.spawnName];

    if(spawn != null && spawn.store[RESOURCE_ENERGY] > 100){
        if(renewCreep(creep)) return;
    }

    switch(creep.memory.task){
        case "harvest":
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "transfer";
                break;
            }

            target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            status = creep.harvest(target);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }
            break;
        case "transfer":
            if(creep.store[RESOURCE_ENERGY] == 0){
                creep.memory.task = "harvest";
                break;
            }


            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) => {
                if(struct.structureType == STRUCTURE_EXTENSION || STRUCTURE_CONTAINER || STRUCTURE_STORAGE || STRUCTURE_SPAWN){
                    if(struct.store){
                        return struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                }
            }})
            if(target == null) break;

            status = creep.transfer(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "harvest";
            }
            break;
        default: creep.memory.task = "harvest";
            break;
    }

    return 1;
}

/** @param creep {Creep}*/
function ucl(creep){
    if(!creep.name.startsWith("CL")) return 0;

    if(creep.memory.task == null) creep.memory.task = "energy";

    let target, status;
    const spawn = Game.spawns[creep.spawnName];

    if(spawn != null && spawn.store[RESOURCE_ENERGY] > 100){
        if(renewCreep(creep)) return;
    }

    switch(creep.memory.task){
        case "energy":
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "upgrade";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) =>{
                if(struct.structureType == STRUCTURE_CONTAINER || struct.structureType == STRUCTURE_STORAGE){
                    return struct.store[RESOURCE_ENERGY] > 0;
                }
            }});
            if(target == null) break;

            status = creep.withdraw(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }
            break;
        case "upgrade":
            if(creep.store[RESOURCE_ENERGY] == 0){
                creep.memory.task = "energy";
                break;
            }

            target = creep.room.controller;
            status = creep.upgradeController(target);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }
            break;
        default: creep.memory.task="upgrade";
            break;
    }

    return 1;
}

/** @param creep {Creep}*/
function builder(creep){
    if(!creep.name.startsWith("B")) return 0;
    if(creep.memory.task == null) creep.memory.task = "energy";

    let target, status;
    const spawn = Game.spawns[creep.spawnName];

    if(spawn != null && spawn.store[RESOURCE_ENERGY] > 100){
        if(renewCreep(creep)) return;
    }

    switch(creep.memory.task){
        case "energy":
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "repair";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) =>{
                if(struct.structureType == STRUCTURE_CONTAINER || struct.structureType == STRUCTURE_STORAGE){
                    return struct.store[RESOURCE_ENERGY] > 0;
                }
            }});
            if(target == null) break;

            status = creep.withdraw(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }
            break;
        case "repair":
            if(creep.store[RESOURCE_ENERGY] == 0){
                creep.memory.task = "energy";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) => {
                return struct.hits < struct.hitsMax;
            }});
            if(target == null){
                creep.memory.task = "build";
                break;
            }

            status = creep.repair(target);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "energy";
            }
            break;
        case "build":
            if(creep.store[RESOURCE_ENERGY] == 0){
                creep.memory.task = "energy";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
            if(target == null){
                creep.memory.task = "repair";
                break;
            }

            status = creep.build(target);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "energy";
            }
            break;
        default: creep.memory.task = "repair";
            break;
    }

    return 1;
}

function renewCreep(creep){
    if(creep.ticksToLive > 500) return false;

    const spawn = Game.spawns[creep.memory.spawnName];
    if(spawn == null) return false;

    let status = spawn.renewCreep(creep);
    if(status == ERR_NOT_IN_RANGE){
        moveCreep(creep, spawn);
        return true;
    }if(status == ERR_NOT_ENOUGH_ENERGY){
        creep.memory.task = "transfer";
        return false;
    }if(status == ERR_BUSY){
        return true;
    }

    return false;
}

function moveCreep(creep, target){
    return creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
}


function processTowers() {
    for(const structureId in Game.structures){
        const struct = Game.structures[structureId];
        if(struct.structureType === STRUCTURE_TOWER){
            let target = struct.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target != null){
                struct.attack(target);
                continue;
            }

            target = struct.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => c.hits < c.hitsMax});
            if(target != null){
                struct.heal(target);
                continue;
            }

            target = struct.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.hits < s.hitsMax});
            if(target != null){
                target.repair(target);
            }
        }
    }
}
