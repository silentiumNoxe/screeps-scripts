const utils = require("utils");

function harvest(roomName, x, y, consumers=[], {namePrefix: "H", quantity: 1, body: [WORK, CARRY, MOVE]}={}){
    if(consumers.length == 0) return;

    const sourcePos = new RoomPosition(x, y, roomName);
    const sourceObj = sourcePos.lookFor(LOOK_SOURCES)[0];
    if(sourceObj == null) return;

    const room = sourceObj.room;

    const creeps = utils.creeps(namePrefix);
    if(creeps.length < quantity){
        room.mySpawns[0].spawnCreep(body, namePrefix);
    }

    creeps.forEach(creep => {
        if(creep.memory.harvest == null || creep.memory.harvest == true){
            creep.moveTo(sourcePos, {reusePath: 10, ignoreCreeps: false});
            creep.harvest(sourceObj);
            creep.memory.harvest = creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }else{
            for(const id of consumers){
                const cons = Game.getObjectById(id);
                if(cons == null || !cons.store || cons.store.getFreeCapacity(RESOURCE_ENERGY) == 0) continue;
                creep.moveTo(cons, {reusePath: 25, ignoreCreeps: false});
                let status = creep.transfer(cons, RESOURCE_ENERGY);
                if(status = ERR_NOT_ENOUGH_ENERGY) creep.memory.harvest = true;
            }
        }
    });
}

module.exports = harvest;
