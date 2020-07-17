//Room----------------------------------------
Object.defineProperties(Room.prototype, {
    sources: {
        get(){
            if(this._sources == null){
                this._sources = this.find(FIND_SOURCES);
            }

            return this._sources;
        }
    }
})
//Creep---------------------------------------
Creep.prototype.hasRole = function(role){
    return creep.memory.role == role;
}

if(!Creep.prototype._harvest){
    Creep.prototype._harvest = Creep.prototype.harvest;
    Creep.prototype.harvest = function(target){
        if(target == null) return ERR_INVALID_ARGS;

        let resourceType;
        if(target.mineralType != null) resourceType = target.mineralType;
        else if(target.depositType != null) resourceType = target.depositType;
        else resourceType = RESOURCE_ENERGY;

        if(this.store.getFreeCapacity(resourceType) == 0) return ERR_FULL;
        return this._harvest(target);
    }
}
//Structure-----------------------------------
Object.defineProperties(Structure.prototype, {
    isBroken: {
        get(){
            return this.hits < this.hitsMax;
        }
    }
})
//main----------------------------------------
module.exports.loop = () => {
    Object.entries(Memory.creeps)
        .forEach(name => {
            const creep = Game.creeps[name];
            if(creep == null) delete Memory.creeps[name];

            if(creep.hasRole("harvester")){
                if(creep.memory.todo == "transfer"){
                    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                        if(s.structureType == STRUCTURE_CONTAINER ||
                            s.structureType == STRUCTURE_STORAGE ||
                            s.structureType == STRUCTURE_TOWER ||
                            s.structureType == STRUCTURE_SPAWN ||
                            s.structureType == STRUCTURE_EXTENSION){

                            return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        }
                    }});
                    let status = creep.transfer(target, RESOURCE_ENERGY);
                    if(status == ERR_NOT_ENOUGH_ENERGY) creep.memory.todo = "harvest";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }

                if(creep.memory.todo = "harvest"){
                    let target = creep.pos.findClosestByPath(creep.room.sources);
                    let status = creep.harvest(target);
                    if(status == ERR_FULL) creep.memory.todo = "transfer";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }
            }else if(creep.hasRole("ucl")){
                if(creep.memory.todo == "energy"){
                    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                        if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                            return s.store[RESOURCE_ENERGY] > 0;
                        }
                    }});
                    let status = creep.withdraw(target, RESOURCE_ENERGY);
                    if(status == ERR_FULL) creep.memory.todo = "upgrade";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }

                if(creep.memory.todo == "upgrade"){
                    let target = creep.room.controller;
                    creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                    let status = creep.upgradeController(target);
                    if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                }
            }else if(creep.hasRole("builder")){
                if(creep.memory.todo == "energy"){
                    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => {
                        if(s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE){
                            return s.store[RESOURCE_ENERGY] > 0;
                        }
                    }});
                    let status = creep.withdraw(target, RESOURCE_ENERGY);
                    if(status == ERR_FULL) creep.memory.todo = "repair";
                    else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath, ignoreCreeps
                }

                if(creep.memory.todo == "repair"){
                    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.isBroken});
                    if(target != null){
                        let status = creep.repair(target);
                        if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath,
                    }else{
                        creep.memory.todo = "build";
                    }
                }

                if(creep.memory.todo == "build"){
                    let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                    if(target != null){
                        let status = creep.repair(target);
                        if(status == ERR_NOT_ENOUGH_RESOURCES) creep.memory.todo = "energy";
                        else if(status == ERR_NOT_IN_RANGE) creep.moveTo(target);// OPTIMIZE: reusePath,
                    }else{
                        creep.memory.todo = "repair";
                    }
                }
            }
        })
}
