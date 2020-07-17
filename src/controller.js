const utils = require("utils");

// function controller(roomName){
//     const room = Game.rooms[roomName];
//     if(room == null) return;
//
//     const target = room.controller;
//
//     function renew(creep){
//         if(!creep.spawn) return false;
//         if(creep.ticksToLive < 500 && creep.spawn.store[RESOURCE_ENERGY] >= 100){
//             creep.moveTo(creep.spawn, {reusePath: 30, ignoreCreeps: false});
//             let status = creep.spawn.renewCreep(creep);
//             return status == ERR_NOT_IN_RANGE;
//         }
//     }
//
//     function takeEnergy(creep){
//         if(creep.memory.energy == null){
//             let energy = creep.pos.findClosestByPath(room.containers, {filter: (st) => st.store[RESOURCE_ENERGY] > 0});
//
//             if(energy != null)
//                 creep.memory.energy = energy.id;
//         }
//
//         const energy = Game.getObjectById(creep.memory.energy);
//         if(energy != null){
//             creep.moveTo(energy, {reusePath: 10, ignoreCreeps: false});
//             creep.withdraw(energy, RESOURCE_ENERGY);
//         }
//     }
//
//     return {
//         upgrade(creepsQuantity, body=[WORK, CARRY, MOVE], namePrefix="CL"){
//             const creeps = utils.creeps(namePrefix);
//             creeps.forEach((creep) => {
//                 if(renew(creep)) return;
//
//                 if(creep.store[RESOURCE_ENERGY] == 0){
//                     takeEnergy(creep);
//                 }else{
//                     creep.memory.energy = null;
//
//                     creep.moveTo(target, {reusePath: 50, ignoreCreeps: false});
//                     creep.upgradeController(target);
//                 }
//             });
//
//             if(creeps.length < creepsQuantity){
//                 room.mySpawns[0].spawnCreep(body, namePrefix);
//             }
//         },
//         claim(roomName){
//
//         },
//         reserve(roomName){
//
//         },
//         attack(roomName){
//
//         }
//     }
// }

module.exports = controller;
