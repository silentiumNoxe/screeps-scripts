require("constants");
const memInit = require("memory_init");
require("prototypes");

global.Debug = {
    path(){
        return Memory.debug.path = !Memory.debug.path;
    },
    spawn(){
        return Memory.debug.spawn = !Memory.debug.spawn;
    },
    target(){
        return Memory.debug.target = !Memory.debug.target;
    },
    role(){
        return Memory.debug.role = !Memory.debug.role;
    },
    creepsLength(){
        return Memory.debug.creepsLength = !Memory.debug.creepsLength;
    }
};

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

    let next = spawn.spawnRole(Creep.ROLE_HARVESTER, "H-");
    if(next) next = spawn.spawnRole(Creep.ROLE_UCL, "UC-");
    if(next) next = spawn.spawnRole(Creep.ROLE_BUILDER, "B-");
    if(next) spawn.spawnRole(Creep.ROLE_CLAIMER, "CL-");
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
            if(!creep.renew()) return;
            if(creep.isWaiting){
                creep.say("😴", true);
                return;
            }

            creep.hasRole(Creep.ROLE_HARVESTER).do(require("role")[Creep.ROLE_HARVESTER]);
            creep.hasRole(Creep.ROLE_UCL).do(require("role")[Creep.ROLE_UCL]);
            creep.hasRole(Creep.ROLE_BUILDER).do(require("role")[Creep.ROLE_BUILDER]);
            creep.hasRole(Creep.ROLE_CLAIMER).do(require("role")[Creep.ROLE_CLAIMER]);
        });

    if(Memory.debug.creepsLength){
        console.log(JSON.stringify(Memory.counter));
    }

    Object.keys(Memory.spawns).forEach(spawnLogic);

    if(Game.cpu.getUsed() > Game.cpu.limit){
        Game.notify("Used "+Game.cpu.getUsed()+" cpu. Limit: "+Game.cpu.limit+". Bucket: "+Game.cpu.bucket+"(creeps: "+Object.keys(Game.creeps).length+")");
    }
}

function rand(max){
    return Math.floor(Math.random()*max);
}
