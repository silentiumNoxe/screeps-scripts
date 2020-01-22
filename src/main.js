let mission = require("mission");

module.exports.loop = () => {
    for(let i = Memory.lastMission | 0; i < Memory.missions.length; i++){
        let abc = Object.assign(Memory.missions[i], mission[Memory.missions[i]]);
        console.log("EXECUTE: "+abc.name);
        abc.execute();
        console.log("STATUS: "+abc.status);
        if(abc.status === mission.status.OK){
            Memory.missions.splice(i, 1);
        } else {
            Memory.missions[i] = abc;
        }
    }
};

