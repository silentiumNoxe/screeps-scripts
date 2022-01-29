require("constants");

module.exports = function () {
    let code;
    if (!Game.creeps.upgrader) {
        code = Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, CARRY, CARRY, WORK], "upgrader", {
            memory: {
                role: Creep.ROLE_UPGRADER,
                state: Creep.STATE_NOTHING,
                prevState: Creep.STATE_NOTHING
            }
        });
        if (code !== OK) {
            console.log("Fail spawn creep 'upgrader' -", code);
        }
    }

    if (!Game.creeps.builder) {
        code = Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, CARRY, CARRY, WORK], "builder", {
            memory: {
                role: Creep.ROLE_BUILDER,
                state: Creep.STATE_NOTHING,
                prevState: Creep.STATE_NOTHING
            }
        });
        if (code !== OK) {
            console.log("Fail spawn creep 'builder' -", code);
        }
    }

    if (!Game.creeps.builder1) {
        code = Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, CARRY, CARRY, WORK], "builder1", {
            memory: {
                role: Creep.ROLE_BUILDER,
                state: Creep.STATE_NOTHING,
                prevState: Creep.STATE_NOTHING
            }
        });
        if (code !== OK) {
            console.log("Fail spawn creep 'builder1' -", code);
        }
    }

    if (!Game.creeps.repairer) {
        code = Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, CARRY, CARRY, WORK], "repairer", {
            memory: {
                role: Creep.ROLE_REPAIRER,
                state: Creep.STATE_NOTHING,
                prevState: Creep.STATE_NOTHING
            }
        });
        if (code !== OK) {
            console.log("Fail spawn creep 'repairer' -", code);
        }
    }

    if (!Game.creeps.repairer1) {
        code = Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, CARRY, CARRY, WORK], "repairer1", {
            memory: {
                role: Creep.ROLE_REPAIRER,
                state: Creep.STATE_NOTHING,
                prevState: Creep.STATE_NOTHING
            }
        });
        if (code !== OK) {
            console.log("Fail spawn creep 'repairer1' -", code);
        }
    }

    const Upgrader = require("role.upgrader");
    const Builder = require("role.builder");
    const Repairer = require("role.repairer");
    for (const creepName of Object.keys(Game.creeps)) {
        const creep = Game.creeps[creepName];
        let creepRole;
        switch (creep.memory.role) {
            case Creep.ROLE_UPGRADER:
                creepRole = new Upgrader(creep);
                break;
            case Creep.ROLE_BUILDER:
                creepRole = new Builder(creep);
                break;
            case Creep.ROLE_REPAIRER:
                creepRole = new Repairer(creep);
                break;
            default:
                console.log("Unknown creep role");
                Game.notify("Unknown creep role!", 30);
                break;
        }

        if (creepRole) {
            creepRole.loop();
        }
    }
}