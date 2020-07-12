const utils = require("utils");

function harvest(id, namePrefix="H", creepsQuantity=3, body=[WORK, CARRY, MOVE]){
    if(id == null) return;
    const source = Game.getObjectById(id);
    const room = source.room;
    const creeps = utils.creeps(namePrefix);

    function renew(creep){
        if(creep.ticksToLive < 500 && room.mySpawn.store[RESOURCE_ENERGY] >= 100){
            creep.moveTo(room.mySpawn, {reusePath: 30, ignoreCreeps: false});
            room.mySpawn.renewCreep(creep);
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
        room.mySpawn.spawnCreep(body, namePrefix+"-"+Math.floor(Math.random()*100));
    }

    return {
        container(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creep => {
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        storage(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creep => {
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        extension(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creep => {
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        spawn(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creep => {
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        },
        tower(id){
            const target = Game.getObjectById(id);
            if(target.store.getFreeCapacity() > 0){
                creeps.forEach(creep => {
                    renew(creep);
                    harvestTransfer(creep, target);
                })
            }
            return this;
        }
    }
}

function harvest1(coord, namePrefix="H", creepsQuantity=3, body=[WORK, CARRY, MOVE]){
    if(coord == null || coord == "") return;
    let split = coord.split(":");
    const room = Game.rooms[split[0]];
    const roomPosition = new RoomPosition(split[1], split[2], split[0]);
    const creeps = Object.entries(Game.creeps).filter(([key, value]) => key.startsWith(namePrefix)).map(([key, value]) => value);


}

module.exports = harvest;
