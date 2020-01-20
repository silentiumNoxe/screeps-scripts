let missionType = require("missionType");
let mission = require("mission");

module.exports.missionBuilder = function(type){
    if(Memory.missions == null){
        this.missions = [];
    }

    switch (type) {
        case missionType.UPGRADE_CONTROLLER:
            return {};
        case missionType.ATTACK:
            return {};
        case missionType.SPAWN_CREEP:
            return {
                setSpawnId(id){
                    this.spawnId = id;
                    return this;
                },
                setCreepBody(body){
                    this.creepBody = body;
                    return this;
                },
                setNamePrefix(prefix){
                    this.namePrefix = prefix;
                    return this;
                },
                save(){
                    Memory.missions.splice(0,0, this);
                }
            };
    }
};

/*
* require('task').create(SPAWN_CREEP) -> new SPAWN_CREEP();
* */
module.exports.loop = () => {

};

