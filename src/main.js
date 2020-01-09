const SPAWN_NAME = "Spawn1";
const ROOM_ADDRESS = "W33S24";

const JOB_HARVEST = "harvest";
const JOB_REST = "rest";
const JOB_UPGRADE_CONTROLLER = "upgrade_controller";

Creep.prototype.setJob = function(name, options){
    this.memory.job = {name: name, options: options};
};

Creep.prototype.work = function(){
    console.log(this.name, "job => "+JSON.stringify(this.memory.job));
    let target = Game.getObjectById(this.memory.job.options.targetId);
    let status;
    switch(this.memory.job.name){
        case JOB_HARVEST:
            status = this.harvest(target);
            console.log(status);
            if(status === ERR_NOT_IN_RANGE){
                this.moveTo(target);
            }
            break;
        case JOB_UPGRADE_CONTROLLER:
            status = this.upgradeController(target);
            console.log(status);
            if(status === ERR_NOT_IN_RANGE){
                this.moveTo(target);
            }else if(status === ERR_NOT_ENOUGH_RESOURCES){
                this.memory.job = {};
            }
            break;
        case JOB_REST:
            status = Game.spawns[SPAWN_NAME].renewCreep(this);
            if(status === ERR_NOT_IN_RANGE){
                this.moveTo(Game.spawns[SPAWN_NAME]);
            }
    }
};

module.exports.loop = function () {
    with(Game){
        if(Object.keys(creeps).length < 5){
            console.log("new creeper", spawns[SPAWN_NAME].spawnCreep([MOVE, WORK, CARRY], ("mwc"+Math.floor(Math.random()*100)), {job: {}}));
        }

        for(const i in creeps){
            let creep = creeps[i];
            if(creep.memory.job == null){
                creep.memory.job = {};
            }
            if(creep.ticksToLive < 200){
                creep.setJob(JOB_REST);
                continue;
            }

            if(creep.store[RESOURCE_ENERGY] < creep.store.getCapacity() && creep.memory.job.name !== JOB_UPGRADE_CONTROLLER){
                creep.setJob(JOB_HARVEST, {targetId: "5bbcab2c9099fc012e63305a"});
            }else if(creep.store[RESOURCE_ENERGY] === creep.store.getCapacity()){
                creep.setJob(JOB_UPGRADE_CONTROLLER, {targetId: "5bbcab2c9099fc012e63305b"});
            }

            creep.work();
        }
    }
};

