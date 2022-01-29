require("constants")

class Repairer extends require("creep") {
    constructor(creep) {
        super(creep);

        this.addStateProcessor(Creep.STATE_NOTHING, () => {
            this.isShouldHarvest() ? this.state = Creep.STATE_HARVEST : this.state = Creep.STATE_REPAIR;
        });

        this.addStateProcessor(Creep.STATE_SLEEP, () => {
            const target = {x: 18, y: 21}
            if (!this.pos.isNearTo(target)) {
                this.targetMove = target;
                this.move();
            }
        });

        this.addStateProcessor(Creep.STATE_HARVEST, () => {
            if (this.isFull()) {
                this.state = Creep.STATE_REPAIR;
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

        this.addStateProcessor(Creep.STATE_REPAIR, () => {
            if (this.isShouldHarvest()) {
                this.state = Creep.STATE_HARVEST;
                return;
            }

            if (this.target == null) {
                this.sleep(100);
                return;
            }

            const code = this.creep.repair(this.target);
            if (code === ERR_NOT_IN_RANGE) {
                this.targetMove = this.target.pos;
                this.move();
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
        if (this.memory.targetStructure) {
            construction = Game.getObjectById(this.memory.targetStructure);
            if (construction != null && construction.hits < construction.hitsMax) {
                return construction;
            }
        }

        construction = this.room.find(FIND_STRUCTURES, {filter: obj => {
            return obj.hits < obj.hitsMax && obj.structureType !== STRUCTURE_WALL;
        }})[0];
        if (construction == null) return null;

        this.memory.targetStructure = construction.id;
        return construction;
    }
}

module.exports = Repairer;