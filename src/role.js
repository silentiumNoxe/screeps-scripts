module.exports[Creep.ROLE_HARVESTER] = function(creep){
    if(creep.memory.todo == Creep.TODO_TRANSFER){
        if(creep.room.name != Game.spawns.Spawn1.room.name){
            creep.moveTo(Game.spawns.Spawn1);
            return;
        }
        let target = Game.getObjectById(creep.memory.target);
        if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.say("👀", true);
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
        }
        if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.say("👀", true);
            if(creep.spawner.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                target = creep.spawner;
            }
        }
        if(target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            creep.say("👀", true);
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                if( s.structureType == STRUCTURE_EXTENSION ||
                    s.structureType == STRUCTURE_CONTAINER ||
                    s.structureType == STRUCTURE_STORAGE){
                        return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            }});
        }
        if(target == null){
            creep.wait(50);
            return;
        }
        if(target.structureType == STRUCTURE_STORAGE) creep.memory.target = null
        else creep.memory.target = target.id;
        let status = creep.transfer(target, RESOURCE_ENERGY);
        if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.todo = Creep.TODO_HARVEST;
        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
        else if(status == OK) creep.say("👆", true);
    }

    if(creep.memory.todo == Creep.TODO_HARVEST){
        let dropped = creep.pos.findClosestByPath(FIND_TOMBSTONES, {filter: (t) => t.store[RESOURCE_ENERGY] > 0});
        if(dropped != null){
            let status = creep.withdraw(dropped, RESOURCE_ENERGY);
            if(status == ERR_FULL){
                creep.memory.todo = Creep.TODO_TRANSFER;
            }else if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(dropped);
            }else if(status == OK){
                creep.say("👇", true);
            }
            return;
        }

        dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {filter: (r) => r.amount > 0});
        if(dropped != null){
            let status = creep.pickup(dropped);
            if(status == ERR_FULL){
                creep.memory.todo = Creep.TODO_TRANSFER;
            }else if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(dropped);
            }else if(status == OK){
                creep.say("👇", true);
            }
            return;
        }

        let target = creep.pos.findClosestByPath(creep.room.sources, {filter: (s) => s.energy > 0});
        if(target == null){
            creep.memory.source = null;
            creep.moveTo(new RoomPosition(0, 26, "E9N23"));
            return;
        }

        creep.memory.source = target.id;
        if(target != null){
            let status = creep.harvest(target);
            if(status == ERR_FULL){
                let containers = creep.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                if(containers.length > 0){
                    creep.transfer(containers[0], RESOURCE_ENERGY);
                    creep.say("👆", true);
                }else{
                    creep.memory.todo = Creep.TODO_TRANSFER;
                }
            }
            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
        }


    }
}
