function build(roomName, namePrefix="B", creepsQuantity=3, body=[WORK, CARRY, MOVE]){
    const room = Game.rooms[roomName];
    if(room == null) return;

    const creeps = room.find(FIND_MY_CREEPS, {filter: (creep) => creep.name.startsWith(namePrefix)});

    creeps.forEach(creep => {
        if(creep.ticksToLive < 500 && room.mySpawn.store[RESOURCE_ENERGY] >= 100){
            creep.moveTo(room.mySpawn, {reusePath: 30, ignoreCreeps: false});
            room.mySpawn.renewCreep(creep);
            return;
        }

        if(creep.store[RESOURCE_ENERGY] == 0){
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
        }else{
            let target;
            if(creep.memory.build == null){
                target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            }
            target = Game.getObjectById(creep.memory.build);
            if(target == null){
                 creep.memory.build = null;
                 return;
            }
            creep.moveTo(target, {reusePath: 20, ignoreCreeps: false});
            creep.build(target);
        }
    });

    if(creeps.length < creepsQuantity){
        room.mySpawn.spawnCreeps(body, namePrefix+"-"+Math.floor(Math.random() * 100));
    }
}

module.exports = build;
