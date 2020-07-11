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
            return harvest(source.id, namePrefix, creepsQuantity, body);
        },
        storage(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(source.id, namePrefix, creepsQuantity, body);
        },
        spawn(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(source.id, namePrefix, creepsQuantity, body);
        },
        tower(id){
            const target = Game.getObjectById(id);

            creeps.forEach(creep => {
                renew(creep);
                harvestTransfer(creep, target);
            })
            return harvest(source.id, namePrefix, creepsQuantity, body);
        }
    }
}

module.exports = harvest;
