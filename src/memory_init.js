if(Memory.clean == null){
    Memory.clean = function(){
        if(this.nextClean == null) this.nextClean = Game.time + 1000;

        if(this.nextClean < Game.time){
            delete this[Creep.ROLE_HARVESTER];
            initHarvester();

            delete this[Creep.ROLE_UCL];
            initUCL();

            delete this[Creep.ROLE_BUILDER];
            initBuilder();

            delete this.nextClean;
        }
    }
}

function initHarvester(){
    const bodies = [
        [WORK, CARRY, MOVE],
        [WORK, CARRY, CARRY, CARRY, MOVE, MOVE],
        [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    ];
    const max = 8;

    Memory[Creep.ROLE_HARVESTER] = {
        min: true,
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
}

function initUCL(){
    const bodies = [
        [WORK, CARRY, MOVE],
        [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE]
    ];
    const max = 6;

    Memory[Creep.ROLE_UCL] = {
        min: true,
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
}

function initBuilder(){
    const bodies = [
        [WORK, CARRY, MOVE],
        [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE]
    ];
    const max = 3;

    Memory[Creep.ROLE_BUILDER] = {
        min: true,
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
}

if(Memory[Creep.ROLE_HARVESTER] == null){
    initHarvester();
}

if(Memory[Creep.ROLE_UCL] == null){
     initUCL();
}

if(Memory[Creep.ROLE_BUILDER] == null){
    initBuilder();
}

if(Memory.friends == null) Memory.friends = [];

function calcBody(value){
    let result = 0;

    for(part of value){
        result += BODYPART_COST[part];
    }

    return result;
}
