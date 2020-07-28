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
            spawn.memory.waitTo = Game.time + 1000;
            return true;//continue;
        }
        return false;//continue?
    }

    return true;//continue?
}

function defenceLogic(){
    Object.keys(Game.rooms)
        .forEach(name => {
            const room = Game.rooms[name];
            if(room == null) return;

            let emptyTowers = 0;
            room.towers.forEach(tower => {
                if(!tower.my) return;

                if(tower.room.enemies.length > 0){
                    Game.notify("In the room "+tower.room.name+" tower found enemies", 20);
                    let status = tower.attack(tower.pos.findNearest(tower.room.enemies));
                    if(status == ERR_NOT_ENOUGH_ENERGY){
                        emptyTowers++;
                        Game.notify("Tower ["+tower.room.name+"] can't attack because does not have energy", 5);
                    }
                }
            });

            if(room.enemies.length > 0 && (room.towers.length > 0 && emptyTowers == room.towers.length)){
                const creeps = Object.keys(Game.creeps).filter(name => {
                    const creep = Game.creeps[name];
                    return creep != null && creep.room.name == room.name && creep.hasRole(Creep.ROLE_ATTACKER);
                }).length;

                if(creeps == 0){
                    if(room.controller.safeModeAvailable == 0){
                        Game.notify("Room "+room.name+" does not have safe mode");
                    }
                    room.controller.activateSafeMode();
                }
            }
        });
}

function spawnLogic(spawnName){
    const spawn = Game.spawns[spawnName];
    if(spawn == null){
        delete Memory.spawns[spawnName];
        return;
    }

    spawn.room.visual.text(spawn.room.energyAvailable, spawn.pos.x+0.4, spawn.pos.y+1.3, {font: 0.5, color: "#f5ef42"});

    spawn.spawnRole(Creep.ROLE_HARVESTER);
    spawn.spawnRole(Creep.ROLE_UCL);
    spawn.spawnRole(Creep.ROLE_BUILDER);
    spawn.spawnRole(Creep.ROLE_CLAIMER);
}

module.exports.loop = () => {
    memInit.init();

    defenceLogic();

    Object.keys(Memory.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];
            if(creep == null){
                delete Memory.creeps[name];
                return;
            }

            creep.count();

            if(Memory.debug.role){
                creep.room.visual.text(creep.memory.role, creep.pos.x, creep.pos.y-1, {font: 0.6});
            }

            if(creep.memory.spawning) return;
            if(!renew(creep)) return;
            if(creep.isWaiting){
                creep.say("😴", true);
                return;
            }

            creep.hasRole(Creep.ROLE_HARVESTER).do(require("role")[Creep.ROLE_HARVESTER]);

            if(creep.hasRole(Creep.ROLE_UCL)){
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

    Object.keys(Memory.spawns).forEach(spawnLogic);

    if(Game.cpu.getUsed() > Game.cpu.limit){
        Game.notify("Used "+Game.cpu.getUsed()+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket+"(creeps: "+Object.keys(Game.creeps).length+")");
    }
}

function rand(max){
    return Math.floor(Math.random()*max);
}
