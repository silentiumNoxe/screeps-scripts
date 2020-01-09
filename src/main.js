var missionFactory = require("missionFactory");

module.exports.loop = function () {
    let missions = [];
    //missionFactory.create("A", {targetId: "5bbcab2c9099fc012e63305b", id: 1, requiredCreeps: 5})
    if(Game.getObjectById("5bbcab2c9099fc012e63305b").level < 8){
        missions.push(missionFactory.create("A", {targetId: "5bbcab2c9099fc012e63305b", id: 1, requiredCreeps: 5}));
    }

    missions.forEach(mission => mission.execute());
};

