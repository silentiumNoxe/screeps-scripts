let save = function(){
    if(Memory.missions == null){
        Memory.missions = [];
    }

    Memory.missions.push(this);
};

let status = {
    ERR: -1,
    OK: 0,
    NO_PROCESSED: 1,
    IN_PROCESS: 2
};

module.exports.status = status;

module.exports.spawnCreep = {
    spawnId: "",
    creepBody: [],
    namePrefix: "",

    status: status.NO_PROCESSED,

    execute(){
        let statusMission = Game.getObjectById(this.spawnId).spawnCreep(this.creepBody, this.namePrefix+"-"+Math.floor(Math.random()*100), {});

        if(statusMission === OK){
            this.status = status.OK;
        }else if(statusMission === ERR_NOT_OWNER || statusMission === ERR_INVALID_ARGS){
            this.status = status.ERR;
        }else{
            this.status = status.IN_PROCESS;
        }
    },

    save: save
};