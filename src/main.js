module.exports.loop = () => {
    let cpuStart = Game.cpu.getUsed();

    const debug = Memory.debug;

    let harvesters = 0;
    let ucls = 0;
    let builders = 0;

    for (var creepName in Memory.creeps) {
        const creep = Game.creeps[creepName];
        if(creep == null) delete Memory.creeps;

        harvesters += harvester(creep);
        ucls += ucl(creep);
        builders += builder(creep);
    }

    if(harvesters < 10){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "H"+Math.floor(Math.random()*100), {memory: {task: "harvest", spawnName: "Spawn1"}});
    }else if(ucls < 3){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "CL"+Math.floor(Math.random()*100), {memory: {task: "energy", spawnName: "Spawn1"}});
    }else if(builders < 1){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "B"+Math.floor(Math.random()*100), {memory: {task: "energy", spawnName: "Spawn1"}});
    }

    console.log("usage cpu:", (Game.cpu.getUsed() - cpuStart).toFixed(2));
};

/** @param creep {Creep}*/
function harvester(creep){
    if(!creep.name.startsWith("H")) return 0;

    let target, status;
    switch(creep.memory.task){
        case "harvest":
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "transfer";
                break;
            }

            target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            status = creep.harvest(target);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
            }
            break;
        case "transfer":
            if(creep.store[RESOURCE_ENERGY] == 0){
                creep.memory.task = "harvest";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) => {
                return struct.structureType == STRUCTURE_CONTAINER && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            })});
            if(target == null)
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
            if(target == null)
                target = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

            status = creep.transfer(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "harvest";
            }
            break;
    }

    return 1;
}

/** @param creep {Creep}*/
function ucl(creep){
    if(!creep.name.startsWith("CL")) return 0;
    let target, status;

    switch(creep.memory.task){
        case "energy":
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "upgrade";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
            if(target == null)
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
            if(target == null)
                target = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

            status = creep.withdraw(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
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
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
            }
            break;
    }

    return 1;
}

/** @param creep {Creep}*/
function builder(creep){
    if(!creep.name.startsWith("B")) return 0;
    let target, status;

    switch(creep.memory.task){
        case "energy":
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "upgrade";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
            if(target == null)
                target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
            if(target == null)
                target = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

            status = creep.withdraw(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
            }
            break;
        case "repair":
            if(creep.store[RESOURCE_ENERGY] == 0){
                creep.memory.task = "energy";
                break;
            }

            target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (struct) => {
                return struct.hits < struct.hitsMax;
            }});
            if(target == null){
                creep.memory.task = "build";
                break;
            }

            status = creep.repair(target);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
            }else if(static == ERR_NOT_ENOUGH_ENERGY){
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
                creep.moveTo(target, {maxOps: 50, ignoreCreeps: false});
            }else if(static == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "energy";
            }
            break;
    }

    return 1;
}


// function processTowers() {
//     for(const structureId in Game.structures){
//         const struct = Game.structures[structureId];
//         if(struct.structureType === STRUCTURE_TOWER){
//             let target = struct.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
//             if(target != null){
//                 struct.attack(target);
//                 continue;
//             }
//
//             target = struct.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => c.hits < c.hitsMax});
//             if(target != null){
//                 struct.heal(target);
//                 continue;
//             }
//
//             target = struct.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.hits < s.hitsMax});
//             if(target != null){
//                 target.repair(target);
//             }
//         }
//     }
// }
