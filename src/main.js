var missionFactory = require("missionFactory");

module.exports.loop = function () {
    Memory.missions.forEach(mission => missionFactory.create(mission).execute());
};

