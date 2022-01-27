class ProxyCreep {
    constructor(creep) {
        this.creep = creep;
        this.creep.stateProcessors = {};
    }

    addStateProcessor(state, callback) {
        if (!this.creep.stateProcessors[state]) {
            this.creep.stateProcessors[state] = [];
        }
        this.creep.stateProcessors[state].push(callback);
    }

    processStates() {
        if (this.ttl < 100) {
            this.say("i'm die!");
        }

        if (!this.creep.stateProcessors[this.state]) {
            console.log("Undefined processors for state -", this.state, "creep -", this.id);
            this.state = 0;
        }

        this.creep.stateProcessors[this.state].forEach(callback => callback(this));
    }

    move() {
        return this.creep.moveTo(this.targetMove.x, this.targetMove.y, {reusePath: 50});
    }

    isNearTo(x, y) {
        if (typeof x === "object") {
            return this.pos.isNearTo(x);
        }
        return this.pos.isNearTo(x, y);
    }

    isEmptyStore(type) {
        return this.getStore(type) === 0;
    }

    getStore(type) {
        return this.creep.store[type];
    }

    getRangeTo(x, y) {
        if (typeof x === "object") {
            return this.pos.getRangeTo(x);
        }
        return this.pos.getRangeTo(x, y);
    }

    transfer(target) {
        if (typeof target === "string") {
            target = Game.getObjectById(target);
        }

        return this.creep.transfer(target, RESOURCE_ENERGY);
    }

    say(message) {
        this.creep.say(message);
    }

    get id() {
        return this.creep.id;
    }

    get ttl() {
        return this.creep.ticksToLive;
    }

    get targetMove() {
        return this.memory.moveTargetPos;
    }

    set targetMove(position) {
        this.memory.moveTargetPos = {x: position.x, y: position.y};
    }

    get memory() {
        return this.creep.memory;
    }

    get state() {
        return this.memory.state;
    }

    get prevState() {
        return this.memory.prevState;
    }

    set state(val) {
        this.memory.prevState = this.memory.state;
        this.memory.state = val;
    }

    get storeCapacity() {
        return this.creep.store.getCapacity();
    }

    get pos() {
        return this.creep.pos;
    }

    /** @return Room*/
    get room() {
        return this.creep.room;
    }
}

module.exports = ProxyCreep;