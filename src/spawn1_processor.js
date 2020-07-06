require("prototype_store");
require("prototype_creep");
require("prototype_position");

const spawnName = "Spawn1";

module.exports = {
    process(){
        const spawn = Game.spawns[spawnName];

        if(spawn == null){
            Game.notify("spawn1 is null");
            return;
        }

        if(spawn.memory.energySources == null){
            spawn.memory.energySources = [];
            let sources = spawn.room.find(FIND_SOURCES);
            for(const source in sources){
                spawn.memory.energySources.push(sources[source].id);
            }
        }

        if(spawn.memory.creepsCounter == null){
            const defaultMemoryCreep = {spawn: spawn.id, action: "start", prevAction: null, targetId: null, debug: false};

            spawn.memory.creepsCounter = {};
            spawn.memory.creepsCounter[Creep.ROLE.ENERGY_HARVESTER] = {
                current: 0, max: 3, body: [WORK, MOVE, CARRY, CARRY], memory: Object.assign(defaultMemoryCreep, {})
            };
            spawn.memory.creepsCounter[Creep.ROLE.CL_UPGRADER] = {
                current: 0, max: 2, body: [WORK, MOVE, CARRY], memory: Object.assign(defaultMemoryCreep, {})
            };
            spawn.memory.creepsCounter[Creep.ROLE.BUILDER] = {
                current: 0, max: 0, body: [WORK, MOVE, CARRY], memory: Object.assign(defaultMemoryCreep, {})
            };
        }

        for(const creepName in Memory.creeps) {
            const creep = Game.creeps[creepName];
            if (creep == null) {
                delete Memory.creeps[creepName];
                continue;
            }

            if (creep.getSpawn({onlyId: true}) !== spawn.id) {
                continue;
            }

            harvesterLogic(creep);
            uclLogic(creep);
            builderLogic(creep);
        }
        spawnCreeps();
    }
};

const defaultActions = {};
defaultActions["renew"] = (creep) => {
    if(creep.getTarget({onlyId: true}) !== Game.spawns[spawnName].id) creep.toMemory({targetId: creep.getSpawn({onlyId: true})});
    return Game.spawns[spawnName].renewCreep(creep);
};
defaultActions["error"] = (creep) => {
    console.log(creep.name, "has an error");
    console.log(creep.memory.errorMsg);
    return "error";
};
defaultActions[ERR_NO_BODYPART] = (creep) => {
    let msg = creep.name+" has an error (ERR_NO_BODYPART). CREEP: "+JSON.stringify(creep)+" MEMORY: "+JSON.stringify(creep.memory);
    Game.notify(msg);
    creep.toMemory({errorMsg: msg});
    return "error";
};
defaultActions[ERR_INVALID_ARGS] = (creep) => {
    let msg = creep.name+" has an error (ERR_INVALID_ARGS). CREEP: "+JSON.stringify(creep)+" MEMORY: "+JSON.stringify(creep.memory);
    Game.notify(msg);
    creep.toMemory({errorMsg: msg});
    return "error";
};
defaultActions[ERR_NOT_IN_RANGE] = (creep) => {
    if(creep.memory.prevAction !== "renew" && creep.ticksToLive < 200){
        return "renew";
    }
    
    creep.myMove(Game.getObjectById(creep.memory.targetId));
    return creep.memory.prevAction;
};

//------------------------------------------------------------------------------------------------
const harvesterActions = {};
harvesterActions["start"] = (creep) =>  harvesterActions["harvest"](creep);
harvesterActions["harvest"] = creep => {
    let status = creep.harvest(Game.getObjectById(creep.memory.targetId));
    if(status === OK && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0){
        status = "transfer";
    }else if(status === OK){
        status = "harvest";
    }
    return status;
};
harvesterActions["transfer"] = (creep) => {
    let status = creep.transfer(Game.getObjectById(creep.memory.targetId), RESOURCE_ENERGY);
    if(status === OK) status = "transfer";
    return status;
};
harvesterActions[OK] = (creep) => {
    return creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? "harvest" : "transfer";
};
harvesterActions[ERR_NOT_ENOUGH_ENERGY] = harvesterActions[ERR_BUSY] = (creep) => {
    if(creep.memory.prevAction === "renew") return "renew";
    return "harvest";
};
harvesterActions[ERR_INVALID_TARGET] = (creep) => {
    if(creep.memory.prevAction === "harvest" || creep.memory.prevAction === "start") {
        let minDistance = 100;
        for (let sourceId of Game.spawns[spawnName].memory.energySources) {
            let source = Game.getObjectById(sourceId);
            let pos = source.pos.getFreePlace();
            if(pos == null) continue;
            let dist = creep.pos.getRangeTo(pos);
            if (dist < minDistance) {
                minDistance = dist;
                creep.memory.targetId = sourceId;
            }
        }
    }else if(creep.memory.prevAction === "transfer"){
        let target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES,
            {filter: (struct) => {
                    if (struct.store) return struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }});
        if(target != null){
            creep.toMemory({targetId: target.id});
        }
    }else if(creep.memory.prevAction === "renew"){
        creep.toMemory({targetId: creep.memory.spawn});
    }
    return creep.memory.prevAction;
};
harvesterActions["renew"] = defaultActions["renew"];
harvesterActions[ERR_FULL] = (creep) => creep.memory.prevAction;
harvesterActions["error"] = defaultActions["error"];
harvesterActions[ERR_NO_BODYPART] = defaultActions[ERR_NO_BODYPART];
harvesterActions[ERR_INVALID_ARGS] = defaultActions[ERR_INVALID_ARGS];
harvesterActions[ERR_NOT_IN_RANGE] = defaultActions[ERR_NOT_IN_RANGE];

//------------------------------------------------------------------------------------------------
const uclActions = {};
uclActions["start"] = (creep) => uclActions["harvest"](creep);
uclActions["harvest"] = (creep) => {
    let status = creep.harvest(Game.getObjectById(creep.memory.targetId));
    if(status === OK && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0){
        status = "upgrade";
    }else if(status === OK){
        status = "harvest";
    }
    return status;
};
uclActions["upgrade"] = (creep) => {
    let status = creep.upgradeController(Game.getObjectById(creep.memory.targetId));
    if(status === OK) status = "upgrade";
    return status;
};
uclActions[ERR_INVALID_TARGET] = (creep) => {
    if(creep.memory.prevAction === "harvest" || creep.memory.prevAction === "start") {
        let minDistance = 100;
        for (let sourceId of Game.spawns[spawnName].memory.energySources) {
            let source = Game.getObjectById(sourceId);
            if(!source.pos.isFree()) continue;
            let dist = creep.pos.getRangeTo(source);
            if (dist < minDistance) {
                minDistance = dist;
                creep.memory.targetId = sourceId;
            }
        }
    }else if(creep.memory.prevAction === "upgrade"){
        creep.memory.targetId = Game.spawns[spawnName].room.controller.id;
    }else if(creep.memory.prevAction === "renew"){
        creep.toMemory({targetId: creep.getSpawn({onlyId: true})});
    }
    return creep.memory.prevAction;
};
uclActions["renew"] = defaultActions["renew"];
uclActions[OK] = (creep) => creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? "harvest" : "transfer";
uclActions[ERR_NOT_IN_RANGE] = defaultActions[ERR_NOT_IN_RANGE];
uclActions[ERR_NOT_ENOUGH_ENERGY] = uclActions[ERR_BUSY] = harvesterActions[ERR_NOT_ENOUGH_ENERGY];
uclActions["error"] = defaultActions["error"];
uclActions[ERR_NO_BODYPART] = defaultActions[ERR_NO_BODYPART];
uclActions[ERR_INVALID_ARGS] = defaultActions[ERR_INVALID_ARGS];

//------------------------------------------------------------------------------------------------
const builderActions = {};
builderActions["start"] = (creep) => builderActions["energy"](creep);
builderActions["energy"] = (creep) => {
    let status = creep.withdraw(creep.getTarget(), RESOURCE_ENERGY);
    if(status === OK) status = "repair";
    return status;
};
builderActions["build"] = (creep) => {
    let status = creep.build(creep.getTarget());
    if(status === OK) status = "build";
    return status;
};
builderActions["repair"] = (creep) => {
    let status = creep.repair(creep.getTarget());
    if(status === OK) status = "repair";
    return status;
};
builderActions[ERR_INVALID_TARGET] = (creep) => {
    let target;
    if(creep.memory.prevAction === "energy" || creep.memory.prevAction === "start") {
        target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES,
            {filter: (struct) => {
                    if (struct.store) return struct.store[RESOURCE_ENERGY] > 0
                }});
    }else if(creep.memory.prevAction === "build"){
        target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if(target == null) return "repair";
    }else if(creep.memory.prevAction === "repair"){
        target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (struct) => {
                return struct.hits < struct.hitsMax;
            }});
        if(target == null) return "build";
    }else if(creep.memory.prevAction === "renew"){
        creep.toMemory({targetId: creep.getSpawn({onlyId: true})});
    }
    if(target != null){
        creep.toMemory({targetId: target.id});
    }

    return creep.memory.prevAction;
};
builderActions[OK] = (creep) => creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? "energy" : "repair";
builderActions[ERR_FULL] = (creep) => "repair";
builderActions["renew"] = defaultActions["renew"];
builderActions[ERR_NOT_IN_RANGE] = defaultActions[ERR_NOT_IN_RANGE];
builderActions[ERR_NOT_ENOUGH_ENERGY] = builderActions[ERR_BUSY] = (creep) => {
    if(creep.memory.prevAction === "renew") return "renew";
    return "energy";
};
builderActions["error"] = defaultActions["error"];
builderActions[ERR_NO_BODYPART] = defaultActions[ERR_NO_BODYPART];
builderActions[ERR_INVALID_ARGS] = defaultActions[ERR_INVALID_ARGS];

/** @param creep {Creep}*/
function harvesterLogic(creep){
    if(!creep.hasRole(Creep.ROLE.ENERGY_HARVESTER)){
        return;
    }

    Game.spawns[spawnName].memory.creepsCounter[Creep.ROLE.ENERGY_HARVESTER].current++;

    creep.do(harvesterActions);
    creep.do(harvesterActions);
}

/** @param creep {Creep}*/
function uclLogic(creep) {
    if(!creep.hasRole(Creep.ROLE.CL_UPGRADER)){
        return;
    }

    Game.spawns[spawnName].memory.creepsCounter[Creep.ROLE.CL_UPGRADER].current++;

    creep.do(uclActions);
    creep.do(uclActions);
}

/** @param creep {Creep}*/
function builderLogic(creep) {
    if(!creep.hasRole(Creep.ROLE.BUILDER)){
        return;
    }

    Game.spawns[spawnName].memory.creepsCounter[Creep.ROLE.BUILDER].current++;

    creep.do(builderActions);
    creep.do(builderActions);
}

function spawnCreeps(){
    const spawn = Game.spawns[spawnName];

    for(let roleName in Creep.ROLE){
        const role = Creep.ROLE[roleName];
        const counter = spawn.memory.creepsCounter[role];
        if(counter.current < counter.max){
            let status = spawn.spawnCreep(
                counter.body,
                role+Math.floor(Math.random()*100),
                {memory: counter.memory, dryRun: true});
            if(status === OK){
                spawn.spawnCreep(
                    counter.body,
                    role+Math.floor(Math.random()*100),
                    {memory: counter.memory});
                break;
            }
        }
        counter.current = 0;
    }
}
