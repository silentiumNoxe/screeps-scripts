if(Memory.harvester == null){
    const bodies = [
        [WORK, CARRY, MOVE],
        [WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
        [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    ];
    const max = 8;

    Memory.harvester = {
        max: max,
        bodies: {}
    };

    bodies.forEach(body => {
        const cost = calcBody(body);
        let a = {
            value: body,
            cost: cost,
            length: body.length
        };

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
         bodies: {}
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
        bodies: {}
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
