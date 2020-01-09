var missionFactory = require("missionFactory");

/*Игровой цикл определяет задачи для всего мира,
  мир сам решает как ему выполнять задачу главное чтобы задача была выполненна*/
module.exports.loop = function () {
    /*Миссия хранит в себе информацию необходимую для её выполнения*/
    let missions = [
        missionFactory.create("A", {targetId: "5bbcab2c9099fc012e63305b", id: 1, requiredCreeps: 5})
    ];

    missions.forEach(mission => mission.execute());
};

