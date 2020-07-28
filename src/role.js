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

module.exports[Creep.ROLE_UCL] = function(creep){
    if(creep.memory.todo == Creep.TODO_ENERGY){
        let target = Game.getObjectById(creep.memory.energy);
        if(target == null || target.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY)){
            creep.say("👀", true);
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                    return s.store[RESOURCE_ENERGY] > 0;
                }
            }});
        }
        if(target == null){
            creep.wait(200);
            return;
        }

        creep.memory.energy = target.id;
        let status = creep.withdraw(target, RESOURCE_ENERGY);
        if(status == ERR_FULL || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) creep.memory.todo = Creep.TODO_UPGRADE;
        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
        else if(status = OK) creep.say("👇", true);
    }

    if(creep.memory.todo == Creep.TODO_UPGRADE){
        let target = creep.room.controller;
        if(!creep.pos.isNearTo(target))
            creep.moveTo(target, {visualizePathStyle: {}});// OPTIMIZE: reusePath, ignoreCreeps
        let status = creep.upgradeController(target);
        if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = Creep.TODO_ENERGY;
    }
}

module.exports[Creep.ROLE_BUILDER] = function(creep){
    if(creep.memory.todo == Creep.TODO_ENERGY){
        let target = Game.getObjectById(creep.memory.energy);
        if(target == null || target.store[RESOURCE_ENERGY] < creep.store.getCapacity(RESOURCE_ENERGY)){
            creep.say("👀", true);
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                    return s.store[RESOURCE_ENERGY] > 0;
                }
            }});
        }

        if(target == null){
            creep.wait(200);
            return;
        }

        creep.memory.energy = target.id;
        let status = creep.withdraw(target, RESOURCE_ENERGY);
        if(status == ERR_FULL || creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) creep.memory.todo = Creep.TODO_REPAIR;
        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
        else if(status = OK) creep.say("👇", true);
    }

    if(creep.memory.todo == Creep.TODO_REPAIR){
        let target = Game.getObjectById(creep.memory.target);
        if(target == null || target.hits == target.hitsMax){
            creep.say("👀", true);
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                if(s.structureType == STRUCTURE_WALL){
                     return false;
                }

                if(s.structureType == STRUCTURE_RAMPART) return s.hits < 1000000;

                if(s.hits < s.hitsMax - (s.hitsMax * 0.1)) return true;
            }});
        }
        if(target != null){
            creep.say("️🔧", true);
            creep.memory.target = target.id;
            let status = creep.repair(target);
            if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = Creep.TODO_ENERGY;
            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
        }else{
            creep.memory.todo = Creep.TODO_BUILD;
        }
    }

    if(creep.memory.todo == Creep.TODO_BUILD){
        let target = Game.getObjectById(creep.memory.target);
        if(target == null){
            creep.say("👀", true);
            target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        }
        if(target != null){
            creep.say("🔨", true);
            creep.memory.target = target.id;
            let status = creep.build(target);
            if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = Creep.TODO_ENERGY;
            else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
            else if(status == ERR_INVALID_TARGET) creep.memory.target = null;
        }else{
            creep.memory.todo = Creep.TODO_REPAIR;
        }
    }
}

module.exports[Creep.ROLE_CLAIMER] = function(creep){
    if(creep.memory.todo == Creep.TODO_FIND_TARGET){
        creep.say("👀", true);
        let target = creep.findClosestByPath(Game.flags, {filter: (f) =>{
            if(f.name.startsWith("attack")){
                return f.room.controller.pos.isEqualTo(f.pos);
            }
        }});
        let todo = Creep.TODO_ATTACK;
        if(target == null){
            target = creep.findClosestByPath(Game.flags, {filter: (f) => f.name.startsWith("claim")});
            todo = Creep.TODO_CLAIM;
        }

        if(target == null){
            target = creep.findClosestByPath(Game.flags, {filter: (f) =>{
                if(f.name.startsWith("reserve")){
                    let ticksToEnd = f.reservation.ticksToEnd;
                    return f.my == false || (ticksToEnd != null && ticksToEnd < (CONTROLLER_RESERVE_MAX * 0.5));
                }
            }});
            todo = Creep.TODO_RESERVE;
        }

        if(target == null){
            todo = Creep.TODO_FIND_TARGET;
            creep.wait(500);
        }

        creep.memory.target = target.name;
        creep.memory.todo = todo;
    }

    if(creep.memory.todo == Creep.TODO_RESERVE){
        let target = Game.flags[creep.memory.target];
        if(target == null){
            creep.memory.todo = Creep.TODO_FIND_TARGET;
            return;
        }

        target = target.room.controller;

        let status = creep.reserveController(target);
        if(status == ERR_NOT_IN_RANGE){
            creep.moveTo(target);
        }

        if(target.reservation.ticksToEnd == CONTROLLER_RESERVE_MAX){
            creep.memory.todo = Creep.TODO_FIND_TARGET;
        }
    }
}
