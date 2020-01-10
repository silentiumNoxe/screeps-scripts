/**
 * @param {number} id mission ID in memory.root
 * @description upgrade controller
 * */
function MissionUpdateController(id){
    this.namePrefix = "uc";
    this.id = id;
    Memory.missions[id].processData = {};
}

MissionUpdateController.name = "uc";

MissionUpdateController.prototype.execute = function () {
    let missionParams = Memory.missions[this.id];
    if(missionParams.isSuccessful){
        Game.notify("UpdateController is successfully, remove mission from memory");
        return;
    }
    /**@type {StructureController}*/
    let target = Game.getObjectById(missionParams.targetId);

    if(target.level === 8){
        missionParams.isSuccessful = true;
        return;
    }

    /**@type {StructureSpawn}*/
    let spawnerRoom = Game.getObjectById(missionParams.processData.spawnId);

    if(spawnerRoom == null) {
        for (let i in Game.spawns) {
            if (target.room.name === Game.spawns[i].room.name) {
                spawnerRoom = Game.spawns[i];
                missionParams.processData.spawnId = spawnerRoom.id;
            }
        }

        if (spawnerRoom == null) {
            Game.notify("Spawner not found in " + target.room.name);
            return;
        }


        if (missionParams.processData.quantityCreeps < missionParams.requiredCreeps) {
            spawnerRoom.spawnCreep([MOVE, WORK, CARRY], (this.namePrefix + "-" + this.id + "-" + Math.floor(Math.random() * 100)), {});
        }

        missionParams.processData.quantityCreeps = 0;
        for (let i in Game.creeps) {
            let creep = Game.creeps[i];
            let name = creep.name.split("-");
            if (name[0] === this.namePrefix && name[1] === String(this.options.id)) {
                missionParams.processData.quantityCreeps++;

                if (creep.memory.canUpgrade) {
                    let status = creep.upgradeController(target);
                    if (status === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    } else if (status === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.canUpgrade = false;
                    }
                } else {
                    let sources = spawnerRoom.room.find(FIND_SOURCES_ACTIVE);
                    let status = creep.harvest(sources[0]);
                    if (status === ERR_NOT_IN_RANGE) {
                        creep.moveTo(sources[0]);
                    }
                }

                if (creep.store[RESOURCE_ENERGY] === creep.store.getCapacity()) {
                    creep.memory.canUpgrade = true;
                }
            }
        }
    }
};

module.exports = {
    create(args){
        switch (args.nameMission) {
            case "uc":
                if(args.targetId == null){
                    throw "targetId is not defined";
                }
                let id = args.id | Math.floor(Math.random()*100);
                let mission = {};
                mission.targetId = args.targetId;
                mission.requiredCreeps = args.requiredCreeps | 1;
                mission.nameMission = args.nameMission;
                Memory.missions[id] = mission;
                return new MissionUpdateController(id);
        }
    }
};