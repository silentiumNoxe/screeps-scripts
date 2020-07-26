function init(){
    if(Memory[Creep.ROLE_HARVESTER] == null || (Game.time - Memory[Creep.ROLE_HARVESTER].updated) > 1000){
        const bodies = [
            [WORK, CARRY, MOVE],
            [WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
            [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
        ];
        const max = 8;

        Memory[Creep.ROLE_HARVESTER] = {
            updated: Game.time,
            min: false,//spawn only min body
            max: max,
            bodies: {},
            memory: {
                waitTo: 0,
                role: Creep.ROLE_HARVESTER,
                todo: Creep.TODO_HARVEST
            }
        };

        bodies.forEach(body => {
            const cost = calcBody(body);
            let a = {
                value: body,
                cost: cost,
                length: body.length
            };

            if(Memory[Creep.ROLE_HARVESTER].bodies["min"] == null || cost < Memory[Creep.ROLE_HARVESTER].bodies["min"].cost){
                Memory[Creep.ROLE_HARVESTER].bodies["min"] = a;
            }

            Memory[Creep.ROLE_HARVESTER].bodies[cost] = a;
        });

        console.log("Memory "+Creep.ROLE_HARVESTER+" was updated");
    }

    if(Memory[Creep.ROLE_UCL] == null || (Game.time - Memory[Creep.ROLE_UCL].updated) > 1000){
         const bodies = [
             [WORK, CARRY, MOVE],
             [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE]
         ];
         const max = 6;

         Memory[Creep.ROLE_UCL] = {
             updated: Game.time,
             min: false,//spawn only min body
             max: max,
             bodies: {},
             memory: {
                 waitTo: 0,
                 role: Creep.ROLE_UCL,
                 todo: Creep.TODO_ENERGY
             }
         };

         bodies.forEach(body => {
             const cost = calcBody(body);
             let a = {
                 value: body,
                 cost: cost,
                 length: body.length
             };

             if(Memory[Creep.ROLE_UCL].bodies["min"] == null || cost < Memory[Creep.ROLE_UCL].bodies["min"].cost){
                 Memory[Creep.ROLE_UCL].bodies["min"] = a;
             }

             Memory[Creep.ROLE_UCL].bodies[cost] = a;
         });

         console.log("Memory "+Creep.ROLE_UCL+" was updated");
    }

    if(Memory[Creep.ROLE_BUILDER] == null || (Game.time - Memory[Creep.ROLE_BUILDER].updated) > 1000){
        const bodies = [
            [WORK, CARRY, MOVE],
            [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE]
        ];
        const max = 3;

        Memory[Creep.ROLE_BUILDER] = {
            updated: Game.time,
            min: false,//spawn only min body
            max: max,
            bodies: {},
            memory: {
                waitTo: 0,
                role: Creep.ROLE_BUILDER,
                todo: Creep.TODO_ENERGY
            }
        };

        bodies.forEach(body => {
            const cost = calcBody(body);
            let a = {
                value: body,
                cost: cost,
                length: body.length
            };

            if(Memory[Creep.ROLE_BUILDER].bodies["min"] == null || cost < Memory[Creep.ROLE_BUILDER].bodies["min"].cost){
                Memory[Creep.ROLE_BUILDER].bodies["min"] = a;
            }

            Memory[Creep.ROLE_BUILDER].bodies[cost] = a;
        });

        console.log("Memory "+Creep.ROLE_BUILDER+" was updated");
    }

    if(Memory.friends == null) Memory.friends = [];
}

function calcBody(value){
    let result = 0;

    for(part of value){
        result += BODYPART_COST[part];
    }

    return result;
}

module.exports.init = init;
