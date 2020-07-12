require("prototype_room");
require("prototype_creep");
// const harvest = require("harvest");
const controller = require("controller");
const build = require("build");
const repair = require("repair");

function initMemory(){
    if(Memory.maxHarvesters == null) Memory.maxHarvesters = 10;
    if(Memory.maxBuilders == null) Memory.maxBuilders = 3;
    if(Memory.maxThiefs == null) Memory.maxThiefs = 0;
    if(Memory.maxAttackers == null) Memory.maxAttackers = 0;

    if(Memory.energySources == null) Memory.energySources = ["5bbcad759099fc012e6374e3", "5bbcad759099fc012e6374e4", "5bbcad759099fc012e6374e8", "5bbcad759099fc012e6374e9"];
}

module.exports.loop = () => {
    let cpuStart = Game.cpu.getUsed();
    let maxCPU = {val: 0, creepName: ""};
    initMemory();

    const debug = Memory.debug;

    processTowers();

    controller("5bbcad759099fc012e6374e5").upgrade(8);//E9N23

    // harvest("5bbcad759099fc012e6374e3", "H1", 4)//18,16
    //     .tower("5f05ffecf159a6369edb06d6")//30,20
    //     .container("5f063581d3c5918913b55191")//20,17
    //     .container("5f0305939f82ec03bdf199a5")//24,28
    //     .container("5f048a3a9b7a52ff7567b7dc")//24,27
    //     .container("5f048e76541ecf62302139ac")//25,27
    //     .container("5f060713f159a616e6db08e8")//34,27
    //     .extension("5f04c499a2794b34a7cf9313")//25,30
    //     .extension("5f0533da3513bc92c7702028")//26,31
    //     .extension("5f050251f08c78de7b8a154b")//27,31
    //     .extension("5f05e91f90a2a0c988a5421b")//27,32
    //     .extension("5f05ad330df7a9ff701eace9")//28,32
    //     .extension("5f0595759a625c36013cf208")//28,22
    //     .extension("5f05354c72a05a36d0f293c5")//28,23
    //     .extension("5f04d2079b7a523ab267cfc2")//28,24
    //     .extension("5f05b2345e332a4ad2c00228")//29,22
    //     .extension("5f05310a3109800f3c52d836");//29,23
    //
    // harvest("5bbcad759099fc012e6374e4", "H2", 4)//18,16
    //     .tower("5f05ffecf159a6369edb06d6")//30,20
    //     .container("5f063581d3c5918913b55191")//20,17
    //     .container("5f0305939f82ec03bdf199a5")//24,28
    //     .container("5f048a3a9b7a52ff7567b7dc")//24,27
    //     .container("5f048e76541ecf62302139ac")//25,27
    //     .container("5f060713f159a616e6db08e8")//34,27
    //     .extension("5f04c499a2794b34a7cf9313")//25,30
    //     .extension("5f0533da3513bc92c7702028")//26,31
    //     .extension("5f050251f08c78de7b8a154b")//27,31
    //     .extension("5f05e91f90a2a0c988a5421b")//27,32
    //     .extension("5f05ad330df7a9ff701eace9")//28,32
    //     .extension("5f0595759a625c36013cf208")//28,22
    //     .extension("5f05354c72a05a36d0f293c5")//28,23
    //     .extension("5f04d2079b7a523ab267cfc2")//28,24
    //     .extension("5f05b2345e332a4ad2c00228")//29,22
    //     .extension("5f05310a3109800f3c52d836");//29,23

    // build("E9N23", "B");
    // repair("E9N23", "R");

    let harvesters = 0;
    let builders = 0;
    let thiefs = 0;
    let attackers = 0;

    for (const creepName in Memory.creeps) {
        const creep = Game.creeps[creepName];
        if(creep == null) delete Memory.creeps[creepName];

        let before = Game.cpu.getUsed();
        harvesters += harvester(creep);
        let after = Game.cpu.getUsed() - before;
        if(maxCPU.val < after) maxCPU = {val: after, creepName: creepName};

        before = Game.cpu.getUsed();
        builders += builder(creep);
        after = Game.cpu.getUsed() - before;
        if(maxCPU.val < after) maxCPU = {val: after, creepName: creepName};

        before = Game.cpu.getUsed();
        thiefs += thief(creep);
        after = Game.cpu.getUsed() - before;
        if(maxCPU.val < after) maxCPU = {val: after, creepName: creepName};

        before = Game.cpu.getUsed();
        attackers += attacker(creep);
        after = Game.cpu.getUsed() - before;
        if(maxCPU.val < after) maxCPU = {val: after, creepName: creepName};
    }

    if(harvesters < Memory.maxHarvesters){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "H"+Math.floor(Math.random()*100), {memory: {task: "harvest", spawnName: "Spawn1", stats: {harvested: 0}}});
    }else if(attackers < Memory.maxAttackers){
        Game.spawns.Spawn1.spawnCreep([ATTACK, MOVE, ATTACK], "A"+Math.floor(Math.random() * 100), {memory: {task: "goto", spawnName: "Spawn1"}});
    }else if(thiefs < Memory.maxThiefs){
        Game.spawns.Spawn1.spawnCreep([MOVE, CARRY, CARRY], "TH"+Math.floor(Math.random()*100), {memory: {task: "steal", spawnName: "Spawn1", stats: {stealed: 0}}});
    }else if(builders < Memory.maxBuilders){
        Game.spawns.Spawn1.spawnCreep([WORK, MOVE, CARRY], "B"+Math.floor(Math.random()*100), {memory: {task: "energy", spawnName: "Spawn1"}});
    }

    console.log("T"+Game.time+" >> usage cpu:", (Game.cpu.getUsed() - cpuStart).toFixed(2), "bucket:", Game.cpu.bucket, "creeps:", Object.getOwnPropertyNames(Memory.creeps).length);
    maxCPU.max = Game.cpu.limit / Object.getOwnPropertyNames(Memory.creeps).length;
    if(maxCPU.val > maxCPU.max) Game.notify("T"+Game.time+" >> creep "+maxCPU.creepName+" used "+maxCPU.val+" CPU but can use "+maxCPU.max, 200);
    maxCPU.val = maxCPU.val.toFixed(2);
    maxCPU.max = maxCPU.max.toFixed(2);
    console.log("T"+Game.time+" >> maxCPU:", JSON.stringify(maxCPU));
    console.log();
    if(Game.cpu.bucket < 10000) Game.notify("T"+Game.time+" >> Bucket was used ("+Game.cpu.bucket+")", 200);
};

/** @param creep {Creep}*/
function harvester(creep){
    if(creep == null) return 0;
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
            target = Game.getObjectById(creep.memory.target);
            if(target == null || target.structureType != null){
                let sources = [];
                for(const id of Memory.energySources){
                    sources.push(Game.getObjectById(id));
                }

                target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if(target == null) break;
                creep.memory.target = target.id;
            }
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

            target = Game.getObjectById(creep.memory.target);
            if(target == null || target.structureType == null){
                let tower = Game.getObjectById("5f05ffecf159a6369edb06d6");
                if(tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                    target = tower;
                }else{
                    target = creep.pos.findClosestByPath(Game.structures,
                        {filter: (struct) => struct.room.name == creep.room.name && struct.structureType == STRUCTURE_EXTENSION && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                    if(target == null){
                        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) => {
                            if(struct.structureType == STRUCTURE_EXTENSION || STRUCTURE_TOWER || STRUCTURE_CONTAINER || STRUCTURE_STORAGE || STRUCTURE_SPAWN){
                                if(struct.store){
                                    return struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                                }
                            }
                        }});
                    }
                }
            }
            if(target == null) break;
            creep.memory.target = target.id;

            status = creep.transfer(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "harvest";
            }else if(status == ERR_FULL){
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) => {
                    if(struct.id == target.id) return false;

                    if(struct.structureType == STRUCTURE_EXTENSION || STRUCTURE_TOWER || STRUCTURE_CONTAINER || STRUCTURE_STORAGE || STRUCTURE_SPAWN){
                        if(struct.store){
                            return struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        }
                    }
                }});

                creep.memory.target = target.id;
            }
            break;
        default: creep.memory.task = "harvest";
            break;
    }

    return 1;
}

function attacker(creep){
    if(creep == null) return 0;
    if(!creep.name.startsWith("A")) return 0;

    if(creep.memory.task == null) creep.memory.task = "goto";

    let target, status;
    const spawn = Game.spawns[creep.memory.spawnName];

    if(spawn != null && creep.room.name == spawn.room.name && spawn.store[RESOURCE_ENERGY] > 100){
        if(renewCreep(creep)) return;
    }

    switch(creep.memory.task){
        case "goto":
            const flag = Object.keys(Game.flags).filter(key => key.startsWith("capture"))[0];
            if(flag == null){
                 creep.memory.task = "home";
                 break;
            }
            if(creep.pos.roomName == flag.pos.roomName){
                creep.memory.task = "attack";
                break;
            }
            moveCreep(creep, flag);
            break;
        case "attack":
            target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
            if(target == null)
                target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
            if(target == null){
                creep.memory.task = "home";
                break;
            }
            let status = creep.attack(target);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(target);
            }
            break;
        case "home":
            if(spawn == null) spawn = Game.spawns[Object.keys(Game.spawns)[0]];
            if(creep.room.name == spawn.room.name){
                creep.memory.task = "goto";
                break;
            }

            moveCreep(creep, spawn);
            break;
        default:
            creep.memory.task = "goto";
            break;
    }

    return 1;
}

/** @param creep {Creep}*/
function builder(creep){
    if(creep == null) return 0;
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
                return struct.structureType != STRUCTURE_WALL && struct.hits < struct.hitsMax || (struct.structureType == STRUCTURE_RAMPART && struct.hits < 1000000);//1M
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

function thief(creep){
    if(creep == null) return 0;
    if(!creep.name.startsWith("TH")) return 0;
    if(creep.memory.task == null) creep.memory.task = "steal";

    let target, status;
    let spawn = Game.spawns[creep.spawnName];

    if(spawn != null && spawn.store[RESOURCE_ENERGY] > 100){
        if(renewCreep(creep)) return;
    }

    switch(creep.memory.task){
        case "steal":
            if(creep.ticksToLive < 10 || creep.hits < 10) Game.notify(creep.name+" stealed "+creep.memory.stats.stealed+" energy");

            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                creep.memory.task = "transfer";
                break;
            }

            if(!creep.pos.isNearTo(Game.flags["steal1"])){
                moveCreep(creep, Game.flags["steal1"]);
                break;
            }

            target = creep.pos.findClosestByRange(FIND_HOSTILE_SPAWNS);
            status = creep.withdraw(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.task = "transfer";
            }
            break;
        case "transfer":
            if(spawn == null) spawn = Game.spawns.Spawn1;
            target = spawn.pos.findClosestByRange(FIND_STRUCTURES, {filter(struct){
                if(struct.structureType == STRUCTURE_EXTENSION || STRUCTURE_TOWER || STRUCTURE_CONTAINER || STRUCTURE_STORAGE || STRUCTURE_SPAWN){
                    if(struct.store){
                        return struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                }
            }});
            if(target == null){
                moveCreep(creep, spawn);
                break;
            }
            status = creep.transfer(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_IN_RANGE){
                moveCreep(creep, target);
            }else if(status == ERR_NOT_ENOUGH_ENERGY){
                creep.memory.stats.stealed += creep.store.getCapacity(RESOURCE_ENERGY);
                creep.memory.task = "steal";
            }
    }

    return 1;
}

// function claimer(creep){
//     if(creep == null) return 0;
//     if(!creep.name.startsWith("CC")) return 0;
//     if(creep.memory.task == null) creep.memory.task = "claim";
//
//     let target, status;
//
//     switch(creep.memory.task){
//         case "goto":
//             const flag = Object.keys(Game.flags).filter(key => key.startsWith("claim"))[0];
//             if(flag == null){
//                  creep.memory.task = "home";
//                  break;
//             }
//             if(creep.pos.roomName == flag.pos.roomName){
//                 creep.memory.task = "attack";
//                 break;
//             }
//             moveCreep(creep, flag);
//             break;
//             break;
//     }
// }

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
    return creep.moveTo(target, {reusePath: 10, maxOps: 100, ignoreCreeps: false});
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

            // target = struct.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => {
            //     return s.id != struct.id && s.hits < s.hitsMax
            // }});
            // if(target != null){
            //     struct.repair(target);
            // }
        }
    }
}
