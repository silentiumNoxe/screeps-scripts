require("prototype_store");
require("prototype_creep");

const spawn = Game.spawns.Spawn1;

const creepsCounter = {};
creepsCounter[Creep.ROLE.ENERGY_HARVESTER] = {
    current: 0, max: 3, notEnough(){return this.current < this.max},
    body: [WORK, MOVE, CARRY], memory: {toDo: Creep.TODO.HARVEST, spawn: spawn.id}
};
creepsCounter[Creep.ROLE.CL_UPGRADER] = {
    current: 0, max: 7, notEnough(){return this.current < this.max},
    body: [WORK, MOVE, CARRY], memory: {toDo: Creep.TODO.HARVEST, spawn: spawn.id}
};
creepsCounter[Creep.ROLE.BUILDER] = {
    current: 0, max: 2, notEnough(){return this.current < this.max},
    body: [WORK, MOVE, CARRY], memory: {toDo: Creep.TODO.HARVEST, spawn: spawn.id}
};

module.exports = {
    process(){
        if(spawn == null){
            Game.notify("spawn1 is null");
            return;
        }

        for(const creepName in Memory.creeps){
            /** @type Creep*/const creep = Game.creeps[creepName];
            if(creep == null){
                delete Memory.creeps[creepName];
                continue;
            }

            if(creep.getSpawn({onlyId: true}) !== spawn.id){
                continue;
            }

            let status;

            //global logic
            switch (creep.memory.toDo) {
                case Creep.TODO.MOVE: status = creep.do(moveCreep); break;
                case Creep.TODO.HARVEST: status = creep.do(harvest); break;
                case Creep.TODO.TRANSFER: status = creep.do(transferEnergy); break;
                case Creep.TODO.UCL: status = creep.do(ucl); break;
                case Creep.TODO.RENEW: status = creep.do(renewCreep); break;
                case Creep.TODO.BUILD: status = creep.do(build); break;
            }

            if(status === ERR_NOT_ENOUGH_RESOURCES){
                creep.setToDo(Creep.TODO.HARVEST);
            }

            //individual logic
            if(creep.hasRole(Creep.ROLE.ENERGY_HARVESTER)){
                creepsCounter[Creep.ROLE.ENERGY_HARVESTER].current++;

                if(creep.memory.toDo !== Creep.TODO.MOVE && creep.store.isFull(RESOURCE_ENERGY)) creep.setToDo(Creep.TODO.TRANSFER);

                if(creep.toDoIs(Creep.TODO.WAIT)){
                    creep.setToDo(Creep.TODO.HARVEST);
                    status = creep.do(harvest);
                }
            }else if(creep.hasRole(Creep.ROLE.CL_UPGRADER)){
                creepsCounter[Creep.ROLE.CL_UPGRADER].current++;

                if(creep.memory.toDo !== Creep.TODO.MOVE && creep.store.isFull(RESOURCE_ENERGY)) creep.setToDo(Creep.TODO.UCL);

                if(creep.toDoIs(Creep.TODO.WAIT)){
                    creep.setToDo(Creep.TODO.HARVEST);
                    status = creep.do(harvest);
                }
            }else if(creep.hasRole(Creep.ROLE.BUILDER)){
                creepsCounter[Creep.ROLE.BUILDER].current++;

                if(creep.memory.toDo !== Creep.TODO.MOVE && creep.store.isFull(RESOURCE_ENERGY)) creep.setToDo(Creep.TODO.BUILD);

                if(creep.toDoIs(Creep.TODO.WAIT)){
                    creep.do(build);
                }
            }

            if(creep.ticksToLive < 200){
                if(!creep.toDoIs(Creep.TODO.MOVE)) {
                    creep.setToDo(Creep.TODO.RENEW);
                }
            }
        }

        spawnCreeps();
    }
};

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
