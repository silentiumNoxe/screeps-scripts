module.exports = function () {
    let code;
    if (!Game.creeps.harvester) {
        code = Game.spawns.Spawn1.spawnCreep([MOVE, CARRY, CARRY, WORK], "harvester", {
            memory: {
                roles: ["harvester"],
                state: STATE_NOTHING,
                prevState: STATE_NOTHING
            }
        });
        if (code !== OK) {
            console.log("Fail spawn creep 'harvester' -", code);
        }
    }

    const harvester = Game.creeps.harvester;
    const state = harvester.memory.state;
    const store = harvester.store;
    const ttl = harvester.ticksToLive;
    if (ttl < 100 && !harvester.memory.doNotRenew) {
        setState(harvester, STATE_RENEW);
    }

    switch (state) {
        case STATE_NOTHING:
            if (store[RESOURCE_ENERGY] < store.getCapacity() && store[RESOURCE_ENERGY] === 0) {
                setState(harvester, STATE_HARVEST);
            } else {
                setState(harvester, STATE_UPGRADE_CONTROLLER);
            }
            break;
        case STATE_MOVE:
            const moveTargetPos = harvester.memory.moveTargetPos;
            if (!moveTargetPos) {
                setState(harvester, harvester.memory.prevState);
                break;
            }

            if (!harvester.pos.isNearTo(moveTargetPos.x, moveTargetPos.y)) {
                code = harvester.moveTo(moveTargetPos.x, moveTargetPos.y);
                if (code === ERR_TIRED) {
                    break;
                } else if (code !== OK) {
                    console.log(`Can't move to ${moveTargetPos.x}:${moveTargetPos.y} -`, code);
                }
            } else {
                setState(harvester, STATE_NOTHING);
            }
            break;
        case STATE_HARVEST:
            if (store.getFreeCapacity(RESOURCE_ENERGY)) {
                code = harvester.harvest(Game.getObjectById("5bbcafab9099fc012e63aff1"));
                if (code === ERR_NOT_IN_RANGE) {
                    setState(harvester, STATE_MOVE);
                    console.log("set target pos of energy");
                    setMoveTargetPos(harvester, 33, 32);
                } else if (code !== OK) {
                    console.log("Can't harvest -", code);
                }
            } else {
                setState(harvester, STATE_UPGRADE_CONTROLLER);
                setMoveTargetPos(harvester, harvester.room.controller.pos.x, harvester.room.controller.pos.y);
            }
            break;
        case STATE_UPGRADE_CONTROLLER:
            const controller = harvester.room.controller;
            code = harvester.upgradeController(controller);
            if (code === ERR_NOT_IN_RANGE) {
                setState(harvester, STATE_MOVE);
                setMoveTargetPos(harvester, controller.pos.x, controller.pos.y);
            } else if (code === ERR_NOT_ENOUGH_RESOURCES) {
                setState(harvester, STATE_HARVEST);
            } else if (code !== OK) {
                console.log("Can't upgrade controller -", code);
            }
            break;
        case STATE_RENEW:
            code = Game.spawns.Spawn1.renewCreep(harvester);
            if (code === ERR_NOT_IN_RANGE) {
                setState(harvester, STATE_MOVE);
                setMoveTargetPos(harvester, Game.spawns.Spawn1.pos.x, Game.spawns.Spawn1.pos.y);
            } else if (code === ERR_NOT_ENOUGH_RESOURCES) {
                harvester.transfer(Game.spawns.Spawn1, RESOURCE_ENERGY);
            } else if (code === OK) {
                setState(harvester, STATE_NOTHING);
            }
            break;
    }
}

function setState(creep, state) {
    creep.memory.prevState = creep.memory.state;
    creep.memory.state = state;
    console.log("set state -", state);
}

function setMoveTargetPos(creep, x, y) {
    creep.memory.moveTargetPos = {x, y};
}

const STATE_NOTHING = 0;
const STATE_MOVE = 1;
const STATE_HARVEST = 2;
const STATE_CARRY = 3;
const STATE_UPGRADE_CONTROLLER = 4;
const STATE_RENEW = 5;