const harvestFromSim = "CREEP h1, h2, h3 HARVEST ROOM('sim')";
const harvestFromSim = "CREEP * HARVEST id1, id2, id3 INFINITY";
const harvestFromSim = "CREEP h1 HARVEST POS(1, 1, 'sim')";
const spawnCreepQuery = "SPAWNER * SPAWN body=[WORK, CARRY, MOVE], name=h1";

const keywords = [
    "CREEP", "creep",
    "SPAWNER", "spawner",
    "HARVEST", "harvest",
    "SPAWN", "spawn",
    "ROOM", "room",
    "POS", "pos",
    "BODY", "body",
    "WORK", "work",
    "CARRY", "carry",
    "MOVE", "move",
    "NAME", "name",
    "INFINITY", "infinity"
];

function Query(string){
    this.string = string;
    this.commands = findCommands(string);
    this.type = null;
    this.creeps = [];
    let ptr = 0;

    // первое слово определяет тип запроса
    let type = this.commands[ptr].toUpperCase();
    if(type == "CREEP"){
        this.type = type = 0;
    }else if(type == "SPAWNER"){
        this.type = type = 1;
    }else{
        throw new Error("Wrong keyword >"+this.commands[ptr]+". Should be CREEP or SPAWNER");
    }

    ptr = 1;

    //todo: add spawner logic
    if(type == 0){
        let creepName = this.commands[ptr];
        let isKeyword = keywords.indexOf(creepName) > -1;
        if(isKeyword){
            throw new Error("Wrong creep name >"+creepName);
        }

        if(creepName == "*"){
            isKeyword = true;
            this.creeps.push("*");
            ptr++;
        }

        while(!isKeyword){
            this.creeps.push(creepName);
            creepName = this.commands[++ptr];
            isKeyword = keywords.indexOf(creepName) > 1;
        }

        let action = this.commands[ptr];
        if(action.toUpperCase("HARVEST")){
            this.action = "harvest";

            this.sources = [];
            let sourceId = this.commands[++ptr];
            isKeyword = keywords.indexOf(sourceId) > -1;
            if(isKeyword){
                throw new Error("Wrong source >"+this.commands[ptr]);
            }

            while(!isKeyword){
                this.sources.push(sourceId);
                sourceId = this.commands[++ptr];
                isKeyword = keywords.indexOf(sourceId) > -1;
            }

            ptr--;
        }else if(action.toUpperCase("TRANSFER")){
            this.action = "transfer";
            this.targets = [];

            let targetId = this.commands[++ptr];
            isKeyword = keywords.indexOf(targetId) > -1;
            if(isKeyword){
                throw new Error("Wrong target >"+this.commands[ptr]);
            }

            while(!isKeyword){
                this.targets.push(targetId);
                targetId = this.commands[++ptr];
                isKeyword = keywords.indexOf(targetId) > -1;
            }

            ptr--;
        }

        let infinity = this.commands[++ptr];
        if(infinity.toUpperCase() == "INFINITY"){
            this.infinity = true;
        }
    }else if(type == 1){
        let spawnName = this.commands[ptr];
        let isKeyword = keywords.indexOf(spawnName) > -1;
        if(isKeyword){
            throw new Error("Wrong spawn name >"+spawnName);
        }


    }
}

function findCommands(string){
    let commands = [];

    let buff = "";
    let isFunc = false;
    for(let i = 0; i < string.length; i++){
        let char = string.charAt(i);
        buff += char;

        if(char == " " && !isFunc || (i == string.length-1)){
            buff = buff.replace(" ", "");
            buff = buff.replace(",", "");
            commands.push(buff);
            buff = "";
            isFunc = false;
            continue;
        }

        if(char == "("){
            isFunc = true;
        }else if(char == ")"){
            commands.push(buff);
            buff = "";
            isFunc = true;
            continue;
        }
    }

    return commands;
}

function funcPos(val){
    if(!val.startsWith("ROOM(")) return null;
}



Query.prototype.next = function(){
    return this.commands[this.ptr++];
}

Query.prototype.hasNext = function(){
    return this.commands[this.ptr+1] != null;
}

Query.prototype.command = function(){
    return this.commands[this.ptr];
}

Query.TYPE = {
    CREEP: 0,
    SPAWNER: 1
}

Query.KEY = {
    CREEP: "CREEP",
    HARVEST: "HARVEST",
    SPAWNER: "SPAWNER"
}

global.$ = function(query){
    const qo = new Query(query);
    if(qo.type == Query.KEY.CREEP){
        this.task.creep = qo.next();
        if(!this.hasNext()){
            throw new Error("Wrong query");
        }
    }
}

global.query = function(task){
    let taskObj = {};
    const commands = task.split(" ");
    let pointer = 0;
    if(commands[pointer++] == "CREEP"){
        taskObj.creep = {
            name: commands[pointer++],
            todo: {}
        };

        let creepTodo = commands[pointer++].toLowerCase();
        taskObj.creep.todo[creepTodo] = {};

        if(commands[pointer] == "FROM"){
            if(commands[++pointer] == "ROOM"){
                taskObj.creep.todo[creepTodo].target = {
                    room: commands[++pointer]
                }
            }
        }else if(commands[pointer] == "TO"){
            taskObj.creep.todo[creepTodo].target = commands[++pointer];
        }
    }

    if(Memory.queries == null) Memory.queries = [];
    Memory.queries.push(taskObj);

    console.log(JSON.stringify(taskObj));
}

module.exports.loop = function () {
    require("basic")();
    sql();
}

function sql(){
    for(let i = 0; i < Memory.queries.length; i++){
        const q = Memory.queries[i];

        if(q.creep != null){
            const creep = Game.creeps[q.creep.name];
            if(creep == null){
                Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE], q.creep.name);
                return;
            }


            if(q.creep.todo.harvest != null){
                if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                    Memory.queries.splice(i, 1);
                }
                let target;
                if(q.creep.todo.harvest.target == null){
                    target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                }

                if(target != null){
                    let status = creep.harvest(target);
                    if(status == ERR_NOT_IN_RANGE){
                        creep.moveTo(target);
                    }

                    continue;
                }
            }

            if(q.creep.todo.transfer != null){
                if(creep.store[RESOURCE_ENERGY] == 0){
                    Memory.queries.splice(i, 1);
                }
                let target = Game.getObjectById(q.creep.todo.transfer.target);
                let status = creep.transfer(target, RESOURCE_ENERGY);
                if(status == ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
            }
        }
    }
}

function build(creep, target){
    if(creep.store[RESOURCE_ENERGY] == 0){
        takeEnergy(Game.getObjectById("5f105add1c8a1702d6645705"));
    }else{
        let status = creep.build(target);
        if(status == ERR_NOT_IN_RANGE){
            creep.moveTo(target);
        }
    }
}

function repair(creep, room){
    if(creep.store[RESOURCE_ENERGY] == 0){
        takeEnergy(Game.getObjectById("5f105add1c8a1702d6645705"));
    }else{
        let targets = Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) => s.hits < s.hitsMax});
        let target = creep.pos.findClosestByPath(targets);
        if(target != null){
            let status = creep.repair(target);
            if(status == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }
        }
    }
}

function updateController(creep, room){
    if(creep.store[RESOURCE_ENERGY] == 0){
        takeEnergy(Game.getObjectById("5f105add1c8a1702d6645705"));
    }else{
        let target = Game.rooms[room].controller;
        let status = creep.updateController(target);
        if(status == ERR_NOT_IN_RANGE){
            creep.moveTo(target);
        }
    }
}

function takeEnergy(from){
    let status = creep.withdraw(from, RESOURCE_ENERGY);
    if(status == ERR_NOT_IN_RANGE){
        creep.moveTo(target);
    }
}
