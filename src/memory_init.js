if(Memory.harvester == null){
    const bodies = [
        [WORK, CARRY, MOVE],
        [WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
        [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    ];
    const max = 8;

    Memory.harvester = {
        max: max,
        bodies: {},
        memory: {
            waitTo: 0,
            role: Creep.ROLE_HARVESTER,
            todo: "harvest"
        }
    };

    bodies.forEach(body => {
        const cost = calcBody(body);
        let a = {
            value: body,
            cost: cost,
            length: body.length
        };

        if(Memory.harvester.bodies["min"] == null || Memory.harvester.bodies["min"].cost < cost){
            Memory.harvester.bodies["min"] = a;
        }

        Memory.harvester.bodies[cost] = a;
    });
}

if(Memory.ucl == null){
     const bodies = [
         [WORK, CARRY, MOVE],
         [WORK, WORK, CARRY, MOVE]
     ];
     const max = 6;

     Memory.ucl = {
         max: max,
         bodies: {},
         memory: {
             waitTo: 0,
             role: Creep.ROLE_UCL,
             todo: "energy"
         }
     };

     bodies.forEach(body => {
         const cost = calcBody(body);
         let a = {
             value: body,
             cost: cost,
             length: body.length
         };

         Memory.ucl.bodies[cost] = a;
     });
}

if(Memory.builder == null){
    const bodies = [
        [WORK, CARRY, MOVE],
        [WORK, WORK, CARRY, MOVE]
    ];
    const max = 3;

    Memory.builder = {
        max: max,
        bodies: {},
        memory: {
            waitTo: 0,
            role: Creep.ROLE_BUILDER,
            todo: "energy"
        }
    };

    bodies.forEach(body => {
        const cost = calcBody(body);
        let a = {
            value: body,
            cost: cost,
            length: body.length
        };

        Memory.builder.bodies[cost] = a;
    });
}

if(Memory.friends == null) Memory.friends = [];

function calcBody(value){
    let result = 0;

    for(part of value){
        result += BODYPART_COST[part];
    }

    return result;
}
