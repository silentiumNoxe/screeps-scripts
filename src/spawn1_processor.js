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

                case Creep.TODO.WAIT:
                    creep.setToDo(Creep.TODO.HARVEST);
                    status = creep.do(harvest);
                    break;
            }

            if(status === ERR_NOT_ENOUGH_RESOURCES){
                creep.setToDo(Creep.TODO.HARVEST);
            }

            //individual logic
            if(creep.hasRole(Creep.ROLE.ENERGY_HARVESTER)){
                creepsCounter[Creep.ROLE.ENERGY_HARVESTER].current++;

                if(creep.memory.toDo !== Creep.TODO.MOVE && creep.store.isFull(RESOURCE_ENERGY)) creep.setToDo(Creep.TODO.TRANSFER);

            }else if(creep.hasRole(Creep.ROLE.CL_UPGRADER)){
                creepsCounter[Creep.ROLE.CL_UPGRADER].current++;

                if(creep.memory.toDo !== Creep.TODO.MOVE && creep.store.isFull(RESOURCE_ENERGY)) creep.setToDo(Creep.TODO.UCL);
            }

            if(creep.ticksToLive < 600){
                creep.setToDo(Creep.TODO.RENEW);
            }
        }

        spawnCreeps();
    }
};

function renewCreep(creep) {
    creep.setTarget(spawn);
    return spawn.renewCreep(creep);
}

function moveCreep(creep) {
    if(creep.memory.move == null) creep.memory.move = {targetId: "", path: []};
    if(creep.memory.move.targetId !== creep.getTarget({onlyId: true})){
        creep.memory.move.targetId = creep.getTarget({onlyId: true});
        creep.memory.move.path = creep.pos.findPathTo(creep.getTarget());
    }

    if(creep.pos.getRangeTo(Game.getObjectById(creep.memory.move.targetId)) <= 5){
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

    return creep.transfer(creep.getTarget());
}

function harvest(creep) {
    creep.setTarget(creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE).id);

    let status = creep.harvest(Game.getObjectById(creep.memory.targetId));
    if(status === ERR_NOT_IN_RANGE){
        creep.setToDo(Creep.TODO.MOVE);
    }
    return status;
}

function ucl(creep) {
    creep.setTarget(spawn.room.controller);
    return creep.upgradeController(creep.getTarget());
}

function spawnCreeps(){
    for(let roleName in Creep.ROLE){
        const role = Creep.ROLE[roleName];
        if(creepsCounter[role].notEnough()){
            spawn.spawnCreep(
                creepsCounter[role].body,
                role+Math.floor(Math.random()*100),
                {memory: creepsCounter[role].memory});
        }
    }
}
