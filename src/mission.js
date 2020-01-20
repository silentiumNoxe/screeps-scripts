module.exports.UPGRADE_CONTROLLER = {
    execute(){

    }
};

/**
 * @example
 *  Memory.createMission(require("missionType").SPAWN_CREEP, )
 * */
module.exports.SPAWN_CREEP = {
    execute(){
        Game.getObjectById(this.spawnId).spawnCreep(this.creepBody, this.namePrefix+"-"+Math.floor(Math.random()*100), {});
    }
};