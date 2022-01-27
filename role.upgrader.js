require("constants");

class Upgrader extends require("creep") {
    constructor(creep) {
        super(creep);

        this.addStateProcessor(Creep.STATE_NOTHING, () => {
            this.isShouldHarvest() ? this.state = Creep.STATE_HARVEST : Creep.STATE_UPGRADE_CONTROLLER;
        });

        this.addStateProcessor(Creep.STATE_HARVEST, () => {
            if (this.isFull()) {
                this.state = Creep.STATE_UPGRADE_CONTROLLER;
            }

            if (!this.room.memory.energySources) {
                this.room.memory.energySources = [];
                for (const source of this.room.find(FIND_SOURCES)) {
                    this.room.memory.energySources.push(source.id);
                }
            }

            let distance = 1000000;
            let selected;
            for (const sourceId of this.room.memory.energySources) {
                const source = Game.getObjectById(sourceId);
                const range = this.getRangeTo(source);
                if (range < distance) {
                    distance = range;
                    selected = source;
                }
            }

            const code = this.creep.harvest(selected);
            if (code === ERR_NOT_IN_RANGE) {
                this.targetMove = selected.pos;
                this.move()
            }
        });

        this.addStateProcessor(Creep.STATE_UPGRADE_CONTROLLER, () => {
            const code = this.creep.upgradeController(this.room.controller);
            if (code === ERR_NOT_IN_RANGE) {
                this.targetMove = this.room.controller.pos;
                this.move();
            } else if (code === ERR_NOT_ENOUGH_RESOURCES) {
                this.state = Creep.STATE_HARVEST;
            }
        });

        this.addStateProcessor(Creep.STATE_CARRY, () => {
            if (this.isShouldHarvest()) {
                this.state = Creep.STATE_HARVEST;
                return;
            }

            const code = this.transfer(Game.spawns.Spawn1);
            if (code === ERR_NOT_IN_RANGE) {
                this.targetMove = Game.spawns.Spawn1.pos;
                this.move();
            } else if (code === ERR_NOT_ENOUGH_RESOURCES) {
                this.state = Creep.STATE_HARVEST;
            }
        });
    }

    loop() {
        if (Game.spawns.Spawn1.store[RESOURCE_ENERGY] === 0) {
            this.state = Creep.STATE_CARRY;
        }

        this.processStates()
    }

    isShouldHarvest() {
        return this.getStore(RESOURCE_ENERGY) < this.storeCapacity && this.isEmptyStore(RESOURCE_ENERGY);
    }

    isFull() {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
    }
}

module.exports = Upgrader;
