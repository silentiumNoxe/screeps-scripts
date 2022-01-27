require("constants")

class Builder extends require("creep") {
    constructor(creep) {
        super(creep);

        this.addStateProcessor(Creep.STATE_NOTHING, () => {
            this.isShouldHarvest() ? this.state = Creep.STATE_HARVEST : this.state = Creep.STATE_BUILD;
        });

        this.addStateProcessor(Creep.STATE_HARVEST, () => {
            if (this.isFull()) {
                this.state = Creep.STATE_BUILD;
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

        this.addStateProcessor(Creep.STATE_BUILD, () => {
            if (this.isShouldHarvest()) {
                this.state = Creep.STATE_HARVEST;
                return;
            }

            if (this.target == null) {
                this.state = Creep.STATE_NOTHING;
            }

            const code = this.creep.build(this.target);
            if (code === ERR_NOT_IN_RANGE) {
                this.targetMove = this.target.pos;
                this.move()
            } else if (code === ERR_NOT_ENOUGH_RESOURCES) {
                this.state = Creep.STATE_HARVEST;
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
        let construction;
        if (this.memory.targetConstruction) {
            construction = Game.getObjectById(this.memory.targetConstruction);
            if (construction != null) {
                return construction;
            }
        }

        construction = this.room.find(FIND_MY_CONSTRUCTION_SITES)[0];
        if (construction == null) return null;

        this.memory.targetConstruction = construction.id;
        return construction;

    }
}

module.exports = Builder;