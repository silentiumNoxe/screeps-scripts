require("prototype_store");
require("prototype_creep");

const spawn = Game.spawns.Spawn1;
const energySources = ["5bbcadc29099fc012e637ca8", "5bbcadc29099fc012e637caa"];

const defaultMemoryCreep = {spawn: spawn.id, action: "start", prevAction: null, targetId: null};
const notEnough = function () {
    return this.current < this.max;
};

const creepsCounter = {};
creepsCounter[Creep.ROLE.ENERGY_HARVESTER] = {
    current: 0, max: 3, notEnough: notEnough,
    body: [WORK, MOVE, CARRY], memory: Object.assign(defaultMemoryCreep, {})
};
creepsCounter[Creep.ROLE.CL_UPGRADER] = {
    current: 0, max: 7, notEnough: notEnough,
    body: [WORK, MOVE, CARRY], memory: Object.assign(defaultMemoryCreep, {})
};
creepsCounter[Creep.ROLE.BUILDER] = {
    current: 0, max: 2, notEnough: notEnough,
    body: [WORK, MOVE, CARRY], memory: Object.assign(defaultMemoryCreep, {})
};

module.exports = {
    process(){
        if(spawn == null){
            Game.notify("spawn1 is null");
            return;
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
        }
        spawnCreeps();
    }
};

const harvesterActions = {
    start: this.harvest,
    harvest: (creep) => creep.harvest(Game.getObjectById(creep.memory.targetId)),
    transfer: (creep) => creep.transfer(Game.getObjectById(creep.memory.targetId)),
    error: (creep) => {
        console.log(creep.name, "has an error");
        return "error";
    }
};
harvesterActions["error"] = (creep) => {

};
harvesterActions[OK] = (creep) => {
    return creep.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY) ? "harvest" : "transfer";
};
harvesterActions[ERR_NO_BODYPART] = (creep) => {
    Game.notify(creep.name+" has an error (ERR_NO_BODYPART). CREEP: "+JSON.stringify(creep)+" MEMORY: "+JSON.stringify(creep.memory));
    return "error";
};
harvesterActions[ERR_INVALID_ARGS] = (creep) => {
    Game.notify(creep.name+" has an error (ERR_INVALID_ARGS). CREEP: "+JSON.stringify(creep)+" MEMORY: "+JSON.stringify(creep.memory));
    return "error";
};
harvesterActions[ERR_NOT_ENOUGH_ENERGY] = (creep) => {
    return "harvest";
};
harvesterActions[ERR_INVALID_TARGET] = (creep) => {
    if(this.memory.prevAction === "harvest") {
        let minDistance = 100;
        for (let sourceId in energySources) {
            let dist = creep.pos.getRangeTo(Game.getObjectById(sourceId));
            if (dist < minDistance) {
                minDistance = dist;
                creep.memory.targetId = sourceId;
            }
        }
    }else if(this.memory.prevAction === "transfer"){
        this.memory.targetId = creep.pos.findClosestByRange(FIND_MY_STRUCTURES,
            {filter: (struct) => struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
    }
};
harvesterActions[ERR_NOT_IN_RANGE] = (creep) => {
    creep.moveTo(creep.memory.targetId);
    return creep.memory.prevAction;
};


/** @param creep {Creep}*/
function harvesterLogic(creep){
    if(!creep.hasRole(Creep.ROLE.ENERGY_HARVESTER)){
        return;
    }

    creepsCounter[Creep.ROLE.ENERGY_HARVESTER].current++;

    creep.do(harvesterActions);
}

/** @param creep {Creep}*/
function uclLogic(creep) {
    if(!creep.hasRole(Creep.ROLE.UCL)){
        return;
    }
}

/** @param creep {Creep}*/
function builderLogic(creep) {
    if(!creep.hasRole(Creep.ROLE.BUILDER)){
        return;
    }
}

function build(creep) {
    if(creep.getTarget().progress == null) {
        let target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if(target == null){
            repair(creep);
        }
        creep.setTarget(target);
    }

    let status = creep.build(creep.getTarget());
    if(status === ERR_NOT_IN_RANGE){
        moveCreep(creep);
    }else if(status === ERR_NOT_ENOUGH_RESOURCES){
        creep.setToDo(Creep.TODO.HARVEST);
    }
}

function repair(creep) {
    let target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (struct) => {
            let type = struct.structureType;
            if(type === STRUCTURE_WALL || type === STRUCTURE_RAMPART) {
                return struct.hits < 500;
            }
            return struct.hits < struct.hitsMax;
        }});

    if(target == null){
        creep.setToDo(Creep.TODO.WAIT);
        return;
    }

    creep.setTarget(target);

    let status = creep.repair(target);
    if(status === ERR_NOT_IN_RANGE){
        moveCreep(creep);
    }else if(status === ERR_NOT_ENOUGH_RESOURCES){
        creep.setToDo(Creep.TODO.HARVEST);
    }
}

function renewCreep(creep) {
    creep.setTarget(spawn);
    let status = spawn.renewCreep(creep);
    if(status === ERR_NOT_IN_RANGE || creep.pos.getRangeTo(creep.getTarget()) > 1){
        moveCreep(creep);
    }else if(status === OK){
        creep.setToDo(Creep.TODO.WAIT);
    }
    return status;
}

function moveCreep(creep) {
    if(creep.memory.move == null) creep.memory.move = {targetId: "", path: []};
    if(creep.memory.move.targetId !== creep.getTarget({onlyId: true})){
        creep.memory.move.targetId = creep.getTarget({onlyId: true});
        creep.memory.move.path = creep.pos.findPathTo(creep.getTarget());
    }

    if(creep.pos.getRangeTo(Game.getObjectById(creep.memory.move.targetId)) <= 1){
        creep.setToDo(Creep.TODO.WAIT);
    }

    let status = creep.moveByPath(creep.memory.move.path);
    if(status === ERR_NOT_FOUND || status === ERR_BUSY){
        creep.memory.move.path = creep.pos.findPathTo(creep.getTarget());
    }

    return status;
}

function transferEnergy(creep) {
    creep.setTarget(creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (struct) => {
            return struct.energy < struct.energyCapacity;
        }}));

    let status = creep.transfer(creep.getTarget(), RESOURCE_ENERGY);
    if(status === ERR_NOT_IN_RANGE){
        moveCreep(creep);
    }

    return status;
}

function harvest(creep) {
    creep.setTarget(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE).id);

    let status = creep.harvest(Game.getObjectById(creep.memory.targetId));
    if(status === ERR_NOT_IN_RANGE){
        moveCreep(creep);
    }
    return status;
}

function ucl(creep) {
    creep.setTarget(spawn.room.controller);

    let status = creep.upgradeController(creep.getTarget());
    if(status === ERR_NOT_IN_RANGE){
        moveCreep(creep);
    }

    return status;
}

function spawnCreeps(){
    for(let roleName in Creep.ROLE){
        const role = Creep.ROLE[roleName];
        if(creepsCounter[role].notEnough()){
            let status = spawn.spawnCreep(
                creepsCounter[role].body,
                role+Math.floor(Math.random()*100),
                {memory: creepsCounter[role].memory, dryRun: true});
            if(status === OK){
                spawn.spawnCreep(
                    creepsCounter[role].body,
                    role+Math.floor(Math.random()*100),
                    {memory: creepsCounter[role].memory});
            }
        }
    }
}
