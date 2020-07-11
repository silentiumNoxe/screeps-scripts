require("prototype_room")

function initMemory(){
    // if(Memory.maxHarvesters == null) Memory.maxHarvesters = 10;
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

    controller("5bbcad759099fc012e6374e5").upgrade(8);
    harvest("5bbcad759099fc012e6374e3", "H1")
        .tower("5f05ffecf159a6369edb06d6")
        .container("5f063581d3c5918913b55191");


    // let harvesters = 0;
    let builders = 0;
    let thiefs = 0;
    let attackers = 0;

    for (const creepName in Memory.creeps) {
        const creep = Game.creeps[creepName];
        if(creep == null) delete Memory.creeps[creepName];

        // let before = Game.cpu.getUsed();
        // harvesters += harvester(creep);
        // let after = Game.cpu.getUsed() - before;
        // if(maxCPU.val < after) maxCPU = {val: after, creepName: creepName};

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


    if(attackers < Memory.maxAttackers){
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

function harvest(id, namePrefix="H", creepsQuantity=3, body=[WORK, CARRY, MOVE]){
    if(id == null) return;
    const source = Game.getObjectById(id);
    const room = source.room;
    const creeps = source.room.find(FIND_MY_CREEPS, {filter: (creep) => creep.name.startsWith(namePrefix)});

    function renew(creep){
        if(creep.ticksToLive < 500 && room.spawn.store[RESOURCE_ENERGY] >= 100){
            creep.moveTo(room.spawn, {reusePath: 30, ignoreCreeps: false});
            room.spawn.renewCreep(creep);
            return;
        }
    }

    function harvestTransfer(creep, target){
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.memory.harvest = false;
        }

        if(creep.memory.harvest){
            creep.moveTo(source, {reusePath: 10, ignoreCreeps: false});
            creep.harvest(source);
        }else{
            creep.moveTo(target, {reusePath: 30, ignoreCreeps: false});
            const status = creep.transfer(target, RESOURCE_ENERGY);
            if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.harvest = true;
        }
    }

    if(creeps.length < creepsQuantity){
        room.spawn.spawnCreep(body, namePrefix+"-"+Math.floor(Math.random()*100));
    }

    return {
        container(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(id);
        },
        storage(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(id);
        },
        spawn(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(id);
        },
        tower(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(id);
        }
    }
}

function controller(id){
    if(id == null) return;
    const target = Game.getObjectById(id);
    const room = target.room;

    function renew(creep){
        if(creep.ticksToLive < 500 && room.spawn.store[RESOURCE_ENERGY] >= 100){
            creep.moveTo(room.spawn, {reusePath: 30, ignoreCreeps: false});
            room.spawn.renewCreep(creep);
            return;
        }
    }

    function takeEnergy(creep){
        if(creep.memory.energy == null){
            const energy = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {
                if(structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE){
                    return structure.store[RESOURCE_ENERGY] >= creep.store.getCapacity(RESOURCE_ENERGY);
                }
            }});

            let minDistance = 100;
            let nearEnergy;
            for(const a of energy){
                let distance = creep.pos.getRangeTo(a);
                if(distance < minDistance){
                    minDistance = distance;
                    tmpEnergy = a;
                }
            }

            if(nearEnergy != null)
                creep.memory.energy = energy.id;
        }

        const energy = Game.getObjectById(creep.memory.energy);
        if(energy != null){
            creep.moveTo(energy, {reusePath: 10, ignoreCreeps: false});
            creep.withdraw(energy, RESOURCE_ENERGY);
        }
    }

    return {
        upgrade(creepsQuantity, body=[WORK, CARRY, MOVE], namePrefix="CL"){
            const creeps = room.find(FIND_MY_CREEPS, {filter: (creep) => creep.name.startsWith(namePrefix)});
            creeps.forEach((creep) => {
                renew(creep);

                if(creep.store[RESOURCE_ENERGY] == 0){
                    takeEnergy(creep);
                }else{
                    creep.memory.energy = null;

                    creep.moveTo(target, {reusePath: 50, ignoreCreeps: false});
                    creep.upgradeController(target);
                }
            })

            if(creeps.length < creepsQuantity){
                room.spawn.spawnCreep(body, namePrefix+"-"+Math.floor(Math.random()*100));
            }
        },
        claim(roomName){

        },
        reserve(roomName){

        },
        attack(roomName){

        }
    }
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
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (struct) => {
                    if(struct.structureType == STRUCTURE_EXTENSION || STRUCTURE_TOWER || STRUCTURE_CONTAINER || STRUCTURE_STORAGE || STRUCTURE_SPAWN){
                        if(struct.store){
                            return struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        }
                    }
                }})
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

/** @param creep {Creep}*/
function ucl(creep){
    if(creep == null) return 0;
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

            target = struct.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => {
                return s.id != struct.id && s.hits < s.hitsMax
            }});
            if(target != null){
                struct.repair(target);
            }
        }
    }
}
