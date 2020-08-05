//todo: CREEP ROOM('E9N23') ...
//todo: CREEP h1 HARVEST ENERGY
function Query(string){
    this.time = Game.time;
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
        let isKeyword = KEYWORDS.indexOf(creepName) > -1;
        if(isKeyword){
            throw new Error("Wrong creep name >"+creepName);
        }

        if(creepName == "*"){
            isKeyword = true;
            this.creeps.push("*");
            ptr++;
        }

        while(!isKeyword){
            if(creepName == null) break;
            this.creeps.push(creepName);
            creepName = this.commands[++ptr];
            isKeyword = KEYWORDS.indexOf(creepName) > 1;
        }

        let action = this.commands[ptr];
        if(action.toUpperCase("HARVEST")){
            this.action = "harvest";

            this.sources = [];
            let sourceId = this.commands[++ptr];
            isKeyword = KEYWORDS.indexOf(sourceId) > -1;
            if(isKeyword){
                throw new Error("Wrong source >"+this.commands[ptr]);
            }

            while(!isKeyword){
                if(sourceId == null) break;
                this.sources.push(sourceId);
                sourceId = this.commands[++ptr];
                isKeyword = KEYWORDS.indexOf(sourceId) > -1;
            }

            ptr--;
        }else if(action.toUpperCase("TRANSFER")){
            this.action = "transfer";
            this.targets = [];

            let targetId = this.commands[++ptr];
            isKeyword = KEYWORDS.indexOf(targetId) > -1;
            if(isKeyword){
                throw new Error("Wrong target >"+this.commands[ptr]);
            }

            while(!isKeyword){
                if(targetId == null) break;
                this.targets.push(targetId);
                targetId = this.commands[++ptr];
                isKeyword = KEYWORDS.indexOf(targetId) > -1;
            }

            ptr--;
        }

        let infinity = this.commands[ptr];
        if(infinity.toUpperCase() == "INFINITY"){
            this.infinity = true;
        }
    }
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

module.exports.Query = Query;
