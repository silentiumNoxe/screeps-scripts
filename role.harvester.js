require("constants");

class Harvester extends require("creep") {
    constructor(creep) {
        super(creep);

        this.addStateProcessor(Creep.STATE_NOTHING, () => {
            this.state = Creep.STATE_HARVEST;
        });

        this.addStateProcessor(Creep.STATE_HARVEST, () => {
            if (this.isFull()) {
                this.state = Creep.STATE_CARRY;
                return;
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

        this.addStateProcessor(Creep.STATE_CARRY, () => {
            if (this.isShouldHarvest()) {
                this.state = Creep.STATE_HARVEST;
                return;
            }

            if (this.target == null) {
                this.sleep(100);
                return;
            }

            const code = this.transfer(this.target);
            switch (code) {
                case ERR_NOT_IN_RANGE:
                    this.targetMove = this.target.pos;
                    this.move();
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    this.state = Creep.STATE_HARVEST;
                    break;
                case ERR_FULL:
                    this.memory.targetContainer = null;
                    console.log(`Err target ${this.target.id} - is full`);
                    break;
            }
        });
    }

    loop() {
        this.processStates();
    }

    isShouldHarvest() {
        return this.getStore(RESOURCE_ENERGY) < this.storeCapacity && this.isEmptyStore(RESOURCE_ENERGY);
    }

    isFull() {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
    }

    get target() {
        let container;
        if (this.memory.targetContainer) {
            container = Game.getObjectById(this.memory.targetContainer);
            if (container != null && container.store.getFreeCapacity() > 0) {
                return container;
            }
        }

        container = this.room.find(FIND_STRUCTURES, {
            filter: obj => {
                const type = obj.structureType === STRUCTURE_EXTENSION ||
                    obj.structureType === STRUCTURE_CONTAINER ||
                    obj.structureType === STRUCTURE_STORAGE ||
                    obj.structureType === STRUCTURE_SPAWN;
                const needEnergy = obj.getFreeCapacity() > 0;
                return type && needEnergy;
            }
        })[0];
        if (container == null) {
            return null;
        }

        this.memory.targetContainer = container.id;
        return container;
    }
}

module.exports = Harvester;