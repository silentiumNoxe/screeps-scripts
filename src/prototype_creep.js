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
    this.memory = Object.assign(this.memory, obj);
};

Creep.prototype.hasRole = function(role){
      return this.name.startsWith(role);
};

Creep.prototype.getSpawn = function({onlyId = false} = {}){
    return onlyId ? this.memory.spawn : Game.getObjectById(this.memory.spawn);
};

Creep.prototype.todoIs = function(todo){
    return this.memory.todo = todo;
};

Creep.prototype.getTodo = function(){
    return this.memory.todo;
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
    let memory = this.memory;
    if(!memory.action) memory.action = "start";

    memory.prevAction = memory.action;
    memory.action = actions[memory.action](this);

    memory.prevActoin = memory.action;
    if(actions[memory.action])
        memory.action = actions[memory.action]();
};

Creep.prototype.myMove = function (target) {
    if(this.memory.move == null) this.memory.move = {targetId: "", path: []};

    if(this.memory.move.targetId !== target.id){
        this.memory.move
    }
};