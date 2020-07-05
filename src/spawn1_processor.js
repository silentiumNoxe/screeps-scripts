require("prototype_store");
require("prototype_creep");

const spawn = Game.spawns.Spawn1;

module.exports = {
    process(){
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
            /** @type Creep*/const creep = Game.creeps[creepName];
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
defaultActions["renew"] = (creep) => spawn.renewCreep(creep);
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
    creep.moveTo(Game.getObjectById(creep.memory.targetId), {swampCost: 3});
    // let status = creep.moveTo(Game.getObjectById(creep.memory.targetId), {reusePath: 100, ignoreCreeps: false, maxOps: 500});
    // if(status === ERR_NO_PATH || status === ERR_NOT_FOUND){
    //     creep.memory.errorMsg = creep.memory.targetId;
    //     return ERR_INVALID_TARGET;
    // }
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
    return "harvest";
};
harvesterActions[ERR_INVALID_TARGET] = (creep) => {
    if(creep.memory.prevAction === "harvest" || creep.memory.prevAction === "start") {
        let minDistance = 100;
        for (let sourceId of spawn.memory.energySources) {
            if(sourceId === creep.memory.errorMsg) continue;

            let dist = creep.pos.getRangeTo(Game.getObjectById(sourceId));
            if (dist < minDistance) {
                minDistance = dist;
                creep.memory.targetId = sourceId;
            }
        }

        creep.memory.errorMsg = "";
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
        for (let sourceId of spawn.memory.energySources) {
            if(sourceId === creep.memory.errorMsg) continue;

            let dist = creep.pos.getRangeTo(Game.getObjectById(sourceId));
            if (dist < minDistance) {
                minDistance = dist;
                creep.memory.targetId = sourceId;
            }
        }

        creep.memory.errorMsg = "";
    }else if(creep.memory.prevAction === "upgrade"){
        creep.memory.targetId = spawn.room.controller.id;
    }else if(creep.memory.prevAction === "renew"){
        creep.toMemory({targetId: creep.memory.spawn});
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
    if(status === OK) status = "build";
    return status;
};
builderActions["build"] = (creep) => {
    let status = creep.build(creep.getTarget());
    if(status === OK) status = "build";
    return status;
};
builderActions["repair"] = (creep) => {
    let status = creep.repair(creep.getTarget());
    if(status === OK) status = "build";
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
    }else if(creep.memory.prevAction === "renew"){
        creep.toMemory({targetId: creep.memory.spawn});
    }
    if(target != null){
        creep.toMemory({targetId: target.id});
    }

    return creep.memory.prevAction;
};
builderActions[OK] = (creep) => creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 ? "energy" : "build";
builderActions[ERR_FULL] = (creep) => "build";
builderActions["renew"] = defaultActions["renew"];
builderActions[ERR_NOT_IN_RANGE] = defaultActions[ERR_NOT_IN_RANGE];
builderActions[ERR_NOT_ENOUGH_ENERGY] = builderActions[ERR_BUSY] = (creep) => "energy";
builderActions["error"] = defaultActions["error"];
builderActions[ERR_NO_BODYPART] = defaultActions[ERR_NO_BODYPART];
builderActions[ERR_INVALID_ARGS] = defaultActions[ERR_INVALID_ARGS];

/** @param creep {Creep}*/
function harvesterLogic(creep){
    if(!creep.hasRole(Creep.ROLE.ENERGY_HARVESTER)){
        return;
    }

    spawn.memory.creepsCounter[Creep.ROLE.ENERGY_HARVESTER].current++;

    creep.do(harvesterActions);
    creep.do(harvesterActions);
}

/** @param creep {Creep}*/
function uclLogic(creep) {
    if(!creep.hasRole(Creep.ROLE.CL_UPGRADER)){
        return;
    }

    spawn.memory.creepsCounter[Creep.ROLE.CL_UPGRADER].current++;

    creep.do(uclActions);
    creep.do(uclActions);
}

/** @param creep {Creep}*/
function builderLogic(creep) {
    if(!creep.hasRole(Creep.ROLE.BUILDER)){
        return;
    }

    spawn.memory.creepsCounter[Creep.ROLE.BUILDER].current++;

    creep.do(builderActions);
    creep.do(builderActions);
}

function spawnCreeps(){
    for(let roleName in Creep.ROLE){
        const role = Creep.ROLE[roleName];
        if(role === Creep.ROLE.BUILDER){
            if(spawn.memory.creepsCounter[Creep.ROLE.ENERGY_HARVESTER].current < spawn.memory.creepsCounter[Creep.ROLE.ENERGY_HARVESTER].max){
                continue;
            }
        }

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
            }
        }
        counter.current = 0;
    }
}
