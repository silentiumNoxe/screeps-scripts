const utils = reqire("utils");

function controller(id){
    if(id == null) return;
    const target = Game.getObjectById(id);
    const room = target.room;

    function renew(creep){
        if(creep.ticksToLive < 500 && room.mySpawn.store[RESOURCE_ENERGY] >= 100){
            creep.moveTo(room.mySpawn, {reusePath: 30, ignoreCreeps: false});
            room.mySpawn.renewCreep(creep);
            return;
        }
    }

    function takeEnergy(creep){
        if(creep.memory.energy == null){
            let energy = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {
                if(structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE){
                    return structure.store[RESOURCE_ENERGY] >= creep.store.getCapacity(RESOURCE_ENERGY);
                }
            }});

            let minDistance = 100;
            let nearEnergy;
            for(const a of energy){
                let distance = creep.pos.getRangeTo(a);
                if(distance < minDistance){
                    minDistance = distance;
                    nearEnergy = a;
                }
            }
            energy = nearEnergy;

            if(energy != null)
                creep.memory.energy = energy.id;
        }

        const energy = Game.getObjectById(creep.memory.energy);
        if(energy != null){
            creep.moveTo(energy, {reusePath: 10, ignoreCreeps: false});
            creep.withdraw(energy, RESOURCE_ENERGY);
        }
    }

    return {
        upgrade(creepsQuantity, body=[WORK, CARRY, MOVE], namePrefix="CL"){
            const creeps = utils.creeps(namePrefix);
            creeps.forEach((creep) => {
                renew(creep);

                if(creep.store[RESOURCE_ENERGY] == 0){
                    takeEnergy(creep);
                }else{
                    creep.memory.energy = null;

                    creep.moveTo(target, {reusePath: 50, ignoreCreeps: false});
                    creep.upgradeController(target);
                }
            })

            if(creeps.length < creepsQuantity){
                room.mySpawn.spawnCreep(body, namePrefix+"-"+Math.floor(Math.random()*100));
            }
        },
        claim(roomName){

        },
        reserve(roomName){

        },
        attack(roomName){

        }
    }
}

module.exports = controller;
