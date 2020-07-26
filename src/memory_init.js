function init(){
    if(Memory.debug == null){
        Memory.debug = {
            path: false,
            spawn: false,
            target: false
        }
    }

    if(Memory[Creep.ROLE_HARVESTER] == null || (Game.time - Memory[Creep.ROLE_HARVESTER].updated) > 1000){
        const bodies = [
            [WORK, CARRY, MOVE],
            [WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
            [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
        ];

        const defaultData = {
            min: false,
            max: 8,
            bodies: {},
            memory: {
                waitTo: 0,
                role: Creep.ROLE_HARVESTER,
                todo: Creep.TODO_HARVEST
            }
        }

        bodies.forEach(body => {
            const cost = calcBody(body);
            let a = {
                value: body,
                cost: cost,
                length: body.length
            };

            if(defaultData.bodies["min"] == null || cost < defaultData.bodies["min"].cost){
                defaultData.bodies["min"] = a;
            }

            defaultData.bodies[cost] = a;
        });

        let data = Object.assign({}, defaultData, Memory[Creep.ROLE_HARVESTER]);
        data.updated = Game.time;

        Memory[Creep.ROLE_HARVESTER] = data;
        console.log("Memory "+Creep.ROLE_HARVESTER+" was updated");
    }

    if(Memory[Creep.ROLE_UCL] == null || (Game.time - Memory[Creep.ROLE_UCL].updated) > 1000){
         const bodies = [
             [WORK, CARRY, MOVE],
             [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE],
             [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
         ];

         const defaultData = {
             min: false,//spawn only min body
             max: 6,
             bodies: {},
             memory: {
                 waitTo: 0,
                 role: Creep.ROLE_UCL,
                 todo: Creep.TODO_ENERGY
             }
         }

         bodies.forEach(body => {
             const cost = calcBody(body);
             let a = {
                 value: body,
                 cost: cost,
                 length: body.length
             };

             if(defaultData.bodies["min"] == null || cost < defaultData.bodies["min"].cost){
                 defaultData.bodies["min"] = a;
             }

             defaultData.bodies[cost] = a;
         });

         let data = Object.assign({}, defaultData, Memory[Creep.ROLE_UCL]);
         data.updated = Game.time;

         Memory[Creep.ROLE_UCL] = data;
         console.log("Memory "+Creep.ROLE_UCL+" was updated");
    }

    if(Memory[Creep.ROLE_BUILDER] == null || (Game.time - Memory[Creep.ROLE_BUILDER].updated) > 1000){
        const bodies = [
            [WORK, CARRY, MOVE],
            [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE]
        ];

        const defaultData = {
            min: false,//spawn only min body
            max: 3,
            bodies: {},
            memory: {
                waitTo: 0,
                role: Creep.ROLE_BUILDER,
                todo: Creep.TODO_ENERGY
            }
        }

        bodies.forEach(body => {
            const cost = calcBody(body);
            let a = {
                value: body,
                cost: cost,
                length: body.length
            };

            if(defaultData.bodies["min"] == null || cost < defaultData.bodies["min"].cost){
                defaultData.bodies["min"] = a;
            }

            defaultData.bodies[cost] = a;
        });

        let data = Object.assign({}, defaultData, Memory[Creep.ROLE_BUILDER]);
        data.updated = Game.time;

        Memory[Creep.ROLE_BUILDER] = data;
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
