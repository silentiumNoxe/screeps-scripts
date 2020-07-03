Creep.ROLE = {
    ENERGY_HARVESTER: "H",
    CL_UPGRADER: "CL"
};

Creep.TODO = {
    WAIT: -1,
    MOVE: 0,
    HARVEST: 1,
    TRANSFER: 2,
    BUILD: 3,
    UCL: 4,
    ATTACK: 5,
    RENEW: 6
};

Creep.prototype.hasRole = function(role){
      return this.name.startsWith(role);
};

Creep.prototype.getSpawn = function({onlyId = false} = {}){
    return onlyId ? this.memory.spawn : Game.getObjectById(this.memory.spawn);
};

Creep.prototype.setToDo = function(val){
    this.memory.toDo = val;
};

Creep.prototype.toDoIs = function(todo){
    return this.memory.toDo = todo;
};

Creep.prototype.setTarget = function(val){
    if(typeof val == "object") val = val.id;
    this.memory.targetId = val;
};

Creep.prototype.getTarget = function({onlyId = false} = {}){
    return onlyId ? this.memory.targetId : Game.getObjectById(this.memory.targetId);
};

Creep.prototype.do = function(action){
    let status = action(this);
    if(status === ERR_NOT_IN_RANGE){
        this.setToDo(Creep.TODO.MOVE);
    }
    return status;
};