module.exports.setRelation = function (name, peace) {
    if(Memory.users == null){
        Memory.users = {};
    }

    if(Memory.users[name] == null){
        Memory.users[name] = {};
    }

    Memory.users[name].peace = peace;
};