let save = function(){
    if(Memory.missions == null){
        Memory.missions = [];
    }

    Memory.missions.push(this);
};

let status = {
    ERR: -1,
    OK: 0,
    NO_PROCESSED: 1,
    IN_PROCESS: 2
};

module.exports.status = status;

module.exports.spawnCreep = {
    name: "spawnCreep",
    status: status.NO_PROCESSED,

    setSpawnId(id){
        this.spawnId = id;
        return this;
    },
    setCreepBody(body){
        this.creepBody = body;
        return this;
    },
    setNamePrefix(prefix){
        this.namePrefix = prefix;
        return this;
    },

    execute(){
        let statusMission = Game.getObjectById(this.spawnId).spawnCreep(this.creepBody, this.namePrefix+"-"+Math.floor(Math.random()*100), {});

        if(statusMission === OK){
            this.status = status.OK;
        }else if(statusMission === ERR_NOT_OWNER || statusMission === ERR_INVALID_ARGS){
            this.status = status.ERR;
        }else{
            this.status = status.IN_PROCESS;
        }
    },

    save: save
};

module.exports.attackRoom = {
    name: "attackRoom",
    status: status.NO_PROCESSED,

    setSpawnId(id){
        this.spawnId = id;
        return this;
    },

    setRoom(room){
        this.room = room;
        return this;
    },

    /**
     * @example
     *  attackRoom.setArmy([{body: [MOVE, ATTACK], requireQuantity: 10}, {body: [MOVE, RANGED_ATTACK], requiredQuantity: 10}])
     * */
    setArmy(name, body, quantity){
        if(this.army == null){
            this.army = {};
        }
        this.army[name] = {};
        this.army[name].body = body;
        this.army[name].creepQuantity = 0;
        this.army[name].requiredQuantity = quantity;
        return this;
    },

    execute(){
        for(let name in this.army){
            if(this.army.hasOwnProperty(name)) {
                if (this.army[name].creepQuantity < this.army[name].requiredQuantity) {
                    module.exports.spawnCreep.setCreepBody(this.army[name].body).setSpawnId(this.spawnId).setNamePrefix(name).save();
                }
            }
        }
    },

    save: save
};