// крип может иметь несколько ролей в имени CL:H:B:TH
Creep.ROLE_HARVESTER = "H";
Creep.ROLE_UCL = "CL";
Creep.ROLE_BUILDER = "B";
Creep.ROLE_THIEF = "TH";

Object.defineProperty(Creep.prototype, "spawn", {
    get(){
        if(!this.memory.spawnName || this.memory.spawnName == "") return;
        if(!this._spawn){
            this._spawn = Game.spawns[this.memory.spawnName];
        }

        return this._spawn;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Creep.prototype, "roles", {
    get(){
        if(!this._roles){
            let roles = creep.name.split("-")[0].split(":");
            if(roles != null) this._roles = roles;
        }

        return this._roles;
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Creep.prototype, "group", {
    get(){
        return creep.memory.group;
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Creep.prototype, "todo", {
    get(){
        return creep.memory.todo;
    },
    set(val){
        creep.memory.todo = val;
    },
    enumerable: true,
    configurable: true
})

Creep.prototype.hasRole = function(role){
    for(const a of this.roles){
        if(a == role) return true;
    }

    return false;
}

Creep.prototype.renew = function(minLives){
    if(this.ticksToLive > minLives) return OK;
    this.moveTo(this.spawn, {reusePath: 10, ignoreCreeps: false});
    return this.spawn.renew(this);
}

if(!Creep.prototype._harvest){
    Creep.prototype._harvest = Creep.prototype.harvest;

    Creep.prototype.harvest = function(target, transfer=[], resource=RESOURCE_ENERGY){
        if(this.todo == "harvest"){
            let status = this.getRangeTo(target) > 1 ? OK : ERR_NOT_IN_RANGE;
            if(this.store.getFreeCapacity(resource) == 0) status = ERR_FULL;

            if(status == ERR_FULL){
                this.todo = "transfer";
            }
            this._harvest(target);
        }
    }
}
