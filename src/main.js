let spawn1Processor = require("spawn1_processor");

module.exports.loop = () => {
    let startCPU = Game.cpu.getUsed();
    processTowers();
    let usedCPU = Game.cpu.getUsed();
    console.log("processTowers cpu: ", (usedCPU - startCPU).toFixed(2));

    startCPU = Game.cpu.getUsed();
    spawn1Processor.process();
    usedCPU = Game.cpu.getUsed();
    console.log("spawn1Processor cpu: ", (usedCPU - startCPU).toFixed(2));
};


function processTowers() {
    for(const structureId in Game.structures){
        const struct = Game.structures[structureId];
        if(struct.structureType === STRUCTURE_TOWER){
            let target = struct.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target != null){
                struct.attack(target);
                continue;
            }

            target = struct.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => c.hits < c.hitsMax});
            if(target != null){
                struct.heal(target);
                continue;
            }

            target = struct.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.hits < s.hitsMax});
            if(target != null){
                target.repair(target);
            }
        }
    }
}