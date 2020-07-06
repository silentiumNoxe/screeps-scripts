require("prototype_position");

Creep.ROLE = {
    ENERGY_HARVESTER: "H",
    CL_UPGRADER: "CL",
    BUILDER: "B"
};

Creep.prototype.toMemory = function(obj){
    if(this.memory.debug) console.log(this.name, "write to memory", JSON.stringify(obj));
    this.memory = Object.assign(this.memory, obj);
};

Creep.prototype.hasRole = function(role){
      return this.name.startsWith(role);
};

Creep.prototype.getSpawn = function({onlyId = false} = {}){
    return onlyId ? this.memory.spawn : Game.getObjectById(this.memory.spawn);
};

Creep.prototype.getTarget = function({onlyId = false} = {}){
    return onlyId ? this.memory.targetId : Game.getObjectById(this.memory.targetId);
};

Creep.prototype.do = function(actions){
    if(this.memory.debug) console.log(this.name, "do action", this.memory.action);

    if(this.memory.action == null) this.toMemory({action: "start"});

    let action = actions[this.memory.action](this);
    this.toMemory({prevAction: this.memory.action});
    this.toMemory({action: action});

    if(this.memory.debug) console.log(this.name, "fatigue", this.fatigue);
};

Creep.prototype.setMoveTarget = function(target){
    let flag = Game.flags[this.name];
    if((flag != null && flag.pos.isNearTo(target))) return;

    if(this.pos.isNearTo(target)) return;

    let pos;
    if(target instanceof RoomPosition) pos = target;
    else if(target.pos) pos = target.pos;

    if(flag != null) flag.remove();
    pos = pos.getFreePlace();
    if(pos != null) this.takePos(pos);
};

Creep.prototype.takePos = function(pos){
    pos.createFlag(this.name);
};

Creep.prototype.myMove = function(target=null){
    if(target != null) this.setMoveTarget(target);

    let flag = Game.flags[this.name];
    if(flag != null){
        this.moveTo(flag, {maxOps: 100, ignoreCreeps: true, swampCost: 3});
        if(this.pos.isEqualTo(flag.pos)) flag.remove();
    }
};