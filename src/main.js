require("constants");
const memInit = require("memory_init");
require("prototypes");

function renew(creep){
    if(creep.spawner == null) creep.spawner = Object.keys(Game.spawns)[0];
    const spawn = creep.spawner;
    if(spawn == null) return true;//continue?
    if(spawn.memory.waitTo > Game.time) return true;//continue?

    if((spawn.memory.renew == null || Game.creeps[spawn.memory.renew] == null) && creep.ticksToLive < 500) spawn.memory.renew = creep.name;
    if(creep.name != spawn.memory.renew) return true;//continue?

    if(creep.spawner.room.name == creep.room.name){
        creep.say("♻️", true);
        let status = creep.spawner.renewCreep(creep);
        if(status == ERR_NOT_IN_RANGE){
            creep.moveTo(creep.spawner);
        }else if(status == ERR_FULL){
            spawn.memory.renew = null;
        }else if(status == ERR_NOT_ENOUGH_ENERGY){
            spawn.memory.waitTo = Game.time + 100;
            return true;//continue;
        }
        return false;//continue?
    }

    return true;//continue?
}

module.exports.loop = () => {
    memInit.init();

    const counter = {
        add(creep){
            const role = creep.memory.role;
            if(role == null) return;

            if(this[role] == null) this[role] = 0;
            this[role]++;
        }
    }

    Object.keys(Game.rooms)
        .forEach(name => {
            const room = Game.rooms[name];
            if(room == null) return;

            room.towers.forEach(tower => {
                if(!tower.my) return;

                if(tower.room.enemies.length > 0){
                    Game.notify("In the room "+tower.room.name+" tower found enemies", 20);
                    let status = tower.attack(tower.pos.findNearest(tower.room.enemies));
                    if(status == ERR_NOT_ENOUGH_ENERGY){
                        Game.notify("Tower ["+tower.room.name+"] can't attack because does not have energy", 5);
                    }
                }
            });
        });

    Object.keys(Memory.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];
            if(creep == null){
                delete Memory.creeps[name];
                return;
            }

            if(Memory.debug.role){
                creep.room.visual.text(creep.memory.role, creep.pos.x, creep.pos.y-1, {font: 0.6});
            }

            counter.add(creep);

            if(creep.memory.spawning) return;

            if(!renew(creep)) return;

            if(creep.isWaiting){
                creep.say("😴", true);
                return;
            }

            if(creep.hasRole(Creep.ROLE_HARVESTER)){
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
                    // if(target == null || target.energy == 0){
                    //     creep.say("👀", true);
                    //     target =
                    // }

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
            }else if(creep.hasRole(Creep.ROLE_UCL)){
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
            }else if(creep.hasRole(Creep.ROLE_BUILDER)){
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
            }else if(creep.hasRole(Creep.ROLE_CLAIMER)){
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
        });//forEach

    Object.keys(Memory.spawns)
        .forEach(name => {
            const spawn = Game.spawns[name];
            if(spawn == null){
                delete Memory.spawns[name];
                return;
            }

            spawn.room.visual.text(spawn.room.energyAvailable, spawn.pos.x+0.4, spawn.pos.y+1.3, {font: 0.5, color: "#f5ef42"});

            if(counter[Creep.ROLE_HARVESTER] < Memory[Creep.ROLE_HARVESTER].max){
                let a = Memory[Creep.ROLE_HARVESTER].bodies["min"];
                if(counter[Creep.ROLE_HARVESTER] > 0 && !Memory[Creep.ROLE_HARVESTER].min){
                    for(cost in Memory[Creep.ROLE_HARVESTER].bodies){
                        if(a == null || (cost > a.cost && cost < spawn.room.energyCapacityAvailable)){
                            a = Memory[Creep.ROLE_HARVESTER].bodies[cost];
                        }
                    }
                }

                if(Memory.debug.spawn)
                    spawn.room.visual.text(Creep.ROLE_HARVESTER+" "+a.cost, spawn.pos.x, spawn.pos.y-1);
                spawn.spawnCreep(a.value, "H-"+rand(100), {memory: Object.assign({}, Memory[Creep.ROLE_HARVESTER].memory, {spawnName: spawn.name})});
                return;
            }
            if(counter[Creep.ROLE_UCL] < Memory[Creep.ROLE_UCL].max){
                let a = Memory[Creep.ROLE_UCL].bodies["min"];
                if(!Memory[Creep.ROLE_UCL].min){
                    for(cost in Memory[Creep.ROLE_UCL].bodies){
                        if(a == null || (cost > a.cost && cost < spawn.room.energyCapacityAvailable)){
                            a = Memory[Creep.ROLE_UCL].bodies[cost];
                        }
                    }
                }

                if(Memory.debug.spawn)
                    spawn.room.visual.text(Creep.ROLE_UCL+" "+a.cost, spawn.pos.x, spawn.pos.y-1);
                spawn.spawnCreep(a.value, "UC-"+rand(100), {memory: Object.assign({}, Memory[Creep.ROLE_UCL].memory, {spawnName: spawn.name})});
                return;
            }
            if(counter[Creep.ROLE_BUILDER] < Memory[Creep.ROLE_BUILDER].max){
                let a = Memory[Creep.ROLE_BUILDER].bodies["min"];
                if(!Memory[Creep.ROLE_BUILDER].min){
                    for(cost in Memory[Creep.ROLE_BUILDER].bodies){
                        if(a == null || (cost > a.cost && cost < spawn.room.energyCapacityAvailable)){
                            a = Memory[Creep.ROLE_BUILDER].bodies[cost];
                        }
                    }
                }

                if(Memory.debug.spawn)
                    spawn.room.visual.text(Creep.ROLE_BUILDER+" "+a.cost, spawn.pos.x, spawn.pos.y-1);
                spawn.spawnCreep(a.value, "B-"+rand(100), {memory: Object.assign({}, Memory[Creep.ROLE_BUILDER].memory, {spawnName: spawn.name})});
                return;
            }
            if(counter[Creep.ROLE_CLAIMER] < Memory[Creep.ROLE_CLAIMER].max){
                let a = Memory[Creep.ROLE_CLAIMER].bodies["min"];
                if(!Memory[Creep.ROLE_CLAIMER].min){
                    for(cost in Memory[Creep.ROLE_CLAIMER].bodies){
                        if(a == null || (cost > a.cost && cost < spawn.room.energyCapacityAvailable)){
                            a = Memory[Creep.ROLE_CLAIMER].bodies[cost];
                        }
                    }
                }

                if(Memory.debug.spawn)
                    spawn.room.visual.text(Creep.ROLE_CLAIMER+" "+a.cost, spawn.pos.x, spawn.pos.y-1);
                spawn.spawnCreep(a.value, "CL-"+rand(100), {memory: Object.assign({}, Memory[Creep.ROLE_CLAIMER].memory, {spawnName: spawn.name})});
                return;
            }
        });

    if(Game.cpu.getUsed() > Game.cpu.limit){
        Game.notify("Used "+Game.cpu.getUsed()+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket+"(creeps: "+Object.keys(Game.creeps).length+")");
    }
}

function rand(max){
    return Math.floor(Math.random()*max);
}
