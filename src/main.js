var missionFactory = require("missionFactory");

module.exports.loop = function () {
    if(Memory.missions == null){
        Memory.missions = {};
    }
    for(let i in Memory.missions){
        let mission = Memory.missions[i];
        mission.id = i;
        missionFactory.create(mission).execute();
    }
};

