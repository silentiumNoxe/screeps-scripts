let mission = require("mission");

module.exports.loop = () => {
    if(Memory.lastMission == null){
        Memory.lastMission = 0;
    }

    for(let i = Memory.lastMission; i < Memory.missions.length; i++){
        let mission1 = Object.assign(Memory.missions[i], mission[Memory.missions[i]]);
        console.log("EXECUTE: "+mission1.name);
        mission1.execute();
        console.log("STATUS: "+mission1.status);
        if(mission1.status === mission.status.OK){
            Memory.missions.splice(i, 1);
        } else {
            Memory.missions[i] = mission1;
        }
    }
};

