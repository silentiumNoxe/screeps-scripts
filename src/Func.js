module.exports.room = function(string, type){
    let tmp = string;

    string = string.substr("ROOM('".length, string.length-2);
    const room = Game.rooms[string];
    if(room == null) throw new Error("You haven't access to this room "+string+" {type: "+type+", func: "+tmp+"}");

    return room.find(type);
};

module.exports.pos = function(string, type){
    let tmp = string;

    string = string.substr("POS(".length, string.length-1);
    let split = string.split(", ");
    if(split.length != 3) throw new Error("Wrong arguments "+tmp);
    let x = Number(split[0]);
    let y = Number(split[1]);
    let room = split[2].substr(1, split[2].length-1);
    const pos = new RoomPosition(x, y, room);
    return pos.lookFor(type);
};

module.exports.creeps = function(arr){
    return arr.map(creep => {
        if(creep == "*") return Game.creeps;
        if(creep.startsWith("ROOM")) return resolveRoom(creep, FIND_MY_CREEPS);
        return Game.creeps[creep];
    });
}

module.exports.sources = function(arr){
    return arr.map((source) => {
        if(creep.startsWith("ROOM")) return resolveRoom(string, FIND_SOURCES);
        if(creep.startsWith("POS")) return resolvePos(string, LOOK_SOURCES);
        return Game.getObjectById(source);
    });
}

module.exports.targets = function(arr){
    return arr.map(target => {
        if(creep.startsWith("ROOM")) return resolveRoom(string, FIND_SOURCES);
        if(creep.startsWith("POS")) return resolvePos(string, LOOK_SOURCES);
    })
}

module.exports.harvest = function(creep, sources){
    let target;
    if(sources.length == 1) target = sources[0];
    else target = creep.pos.findClosestByPath(sources);

    let status = creep.harvest(target);
    if(status == ERR_NOT_IN_RANGE){
        creep.moveTo(target);
    }
}
