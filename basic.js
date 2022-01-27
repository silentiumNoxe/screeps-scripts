module.exports = () => {
    // defenceLogic();

    // Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "b1");
    // Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "b2");
    // Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "b3");
    // Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "b4");

    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "uc1");
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "uc2");
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "uc3");
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "uc4");

    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "h1");
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "h2");
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "h3");
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, MOVE], "h4");

    Object.keys(Game.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];

            if(creep.name.startsWith("h")){
                if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                        if(s.store != null && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
                            return s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_SPAWN;
                        }
                    }});

                    let status = creep.transfer(target, RESOURCE_ENERGY);
                    if(status == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                        return;
                    }
                }
                let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                let status = creep.harvest(source);
                if(status == ERR_NOT_IN_RANGE){
                    creep.moveTo(source);
                }
            }
        })

    const uc1 = Game.creeps.uc1;
    if(uc1 != null) updateController(uc1, "E9N23");

    const uc2 = Game.creeps.uc2;
    if(uc2 != null) updateController(uc2, "E9N23");

    const uc3 = Game.creeps.uc3;
    if(uc3 != null) updateController(uc3, "E9N24");

    const uc4 = Game.creeps.uc4;
    if(uc4 != null) updateController(uc4, "E9N24");


    const buildTarget = Game.getObjectById("5f230efc6059df09f191f0a2");

    const b1 = Game.creeps.b1;
    if(b1 != null) build(b1, buildTarget);

    const b2 = Game.creeps.b2;
    if(b2 != null) build(b2, buildTarget);

    const b3 = Game.creeps.b3;
    if(b3 != null) build(b3, buildTarget);

    const b4 = Game.creeps.b4;
    if(b4 != null) build(b4, buildTarget);
}

function build(creep, target){
    if(creep.store[RESOURCE_ENERGY] == 0){
        takeEnergy(creep, Game.getObjectById("5f105add1c8a1702d6645705"));
    }else{
        let status = creep.build(target);
        if(status == ERR_NOT_IN_RANGE){
            creep.moveTo(target);
        }
    }
}

function repair(creep, room){
    if(creep.store[RESOURCE_ENERGY] == 0){
        takeEnergy(creep, Game.getObjectById("5f105add1c8a1702d6645705"));
    }else{
        let targets = Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) => s.hits < s.hitsMax});
        let target = creep.pos.findClosestByPath(targets);
        if(target != null){
            let status = creep.repair(target);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
        }
    }
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


function updateController(creep, room){
    if(creep.store[RESOURCE_ENERGY] == 0){
        takeEnergy(creep, Game.getObjectById("5f105add1c8a1702d6645705"));
    }else{
        let target = Game.rooms[room].controller;
        let status = creep.upgradeController(target);
        if(status == ERR_NOT_IN_RANGE){
            creep.moveTo(target);
        }
    }
}

function takeEnergy(creep, from){
    let status = creep.withdraw(from, RESOURCE_ENERGY);
    if(status == ERR_NOT_IN_RANGE){
        creep.moveTo(from);
    }
}
