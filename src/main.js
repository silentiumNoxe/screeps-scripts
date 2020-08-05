require("constants");
const Func = require("Func");
const Query = require("Query");

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

global.$ = function(query){
    const qo = new Query(query);
    console.log(JSON.stringify(qo));
    if(Memory.queries == null) Memory.queries = [];
    Memory.queries.push(qo);
}

module.exports.loop = function () {
    if(Memory.queries == null) Memory.queries = [];

    for(let i = 0; i < Memory.queries.length; i++){
        const q = Memory.queries[i];

        if(q.type == null) throw new Error("Wrong query type "+q.type);

        if(q.type == 0){//creep
            const creeps = Func.creeps(q.creeps);
            if(creeps.length == 0) throw new Error("Creeps not found ("+q.string+")");

            if(q.action == "harvest"){
                const sources = Func.sources(q.sources);
                creeps.forEach((creep) => Func.harvest(creep, sources));
            }else if(q.action == "transfer"){

            }
        }
    }
}
