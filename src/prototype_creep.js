Creep.ROLE = {
    ENERGY_HARVESTER: "H",
    CL_UPGRADER: "CL",
    BUILDER: "B"
};

Creep.TODO = {
    WAIT: -1,
    MOVE: 0,
    HARVEST: 1,
    TRANSFER: 2,
    BUILD: 3,
    UCL: 4,
    ATTACK: 5,
    RENEW: 6,
    REPAIR: 7
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

Creep.prototype.setTarget = function(target, todo){
    if(target == null) return;

    if(typeof target == "object") target = target.id;
    this.toMemory({targetId: target, todo: todo});
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