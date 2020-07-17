const utils = require("utils");

function harvest(roomName, x, y, consumers=[], {namePrefix = "H", quantity = 1, body = [WORK, CARRY, MOVE]}={}){
    consumers = consumers.map(id => Game.getObjectById(id)).filter(cons => {
        return cons != null && cons.store && cons.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    });
    if(consumers.length == 0) return;
    let canSpawn = true;

    const sourcePos = new RoomPosition(x, y, roomName);
    let sourceObj, room;
    const creeps = utils.creeps(namePrefix);

    function renew(creep){
        if(!creep.spawn) return false;
        if(creep.ticksToLive < 500 && creep.spawn.store[RESOURCE_ENERGY] >= 100){
            creep.moveTo(creep.spawn, {reusePath: 30, ignoreCreeps: false});
            let status = creep.spawn.renewCreep(creep);
            return status == ERR_NOT_IN_RANGE;
        }
    }

    creeps.forEach(creep => {
        if(renew(creep)) return;

        if(creep.memory.harvest){
            if(creep.room.name != roomName){
                 creep.moveTo(sourcePos, {reusePath: 100, ignoreCreeps: true});
                 return
            }

            if(Game.rooms[roomName] != null){
                sourceObj = sourcePos.lookFor(LOOK_SOURCES)[0];
                if(sourceObj == null) return;
                room = sourceObj.room;
            }
            let status = creep.harvest(sourceObj);
            if(status == ERR_FULL) creep.memory.harvest = false;
            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(sourcePos, {reusePath: 50, ignoreCreeps: false});
        }else{
            for(const cons of consumers){
                creep.moveTo(cons, {reusePath: 25, ignoreCreeps: false});
                let status = creep.transfer(cons, RESOURCE_ENERGY);
                if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.harvest = true;
            }
        }
    });

    if(sourceObj.energy < 100) canSpawn = false;

    if(canSpawn && creeps.length < quantity){
        room.mySpawns[0].spawnCreep(body, namePrefix);
    }
}

module.exports = harvest;
