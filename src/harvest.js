function harvest(id, namePrefix="H", creepsQuantity=3, body=[WORK, CARRY, MOVE]){
    if(id == null) return;
    const source = Game.getObjectById(id);
    const room = source.room;
    const creeps = Object.entries(Game.creeps).filter((creep) => creep.name.startsWith(namePrefix)));

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
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creepName => {
                    const creep = Game.creeps[creepName];
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        storage(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creepName => {
                    const creep = Game.creeps[creepName];
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        extension(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creepName => {
                    const creep = Game.creeps[creepName];
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        spawn(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creepName => {
                    const creep = Game.creeps[creepName];
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        tower(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creepName => {
                    const creep = Game.creeps[creepName];
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        }
    }
}

module.exports = harvest;
