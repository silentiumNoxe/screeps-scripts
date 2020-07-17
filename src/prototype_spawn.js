if(!StructureSpawn.prototype._spawnCreep){
    StructureSpawn.prototype._spawnCreep = StructureSpawn.prototype.spawnCreep;

    StructureSpawn.prototype.spawnCreep = function(body=[WORK, CARRY, MOVE], namePrefix="", memory={}){
        if(namePrefix == "") return;
        memory.spawnName = this.name;

        let name;
        let status = null;
        for(let i = 0; i < 10; i++){
            name = namePrefix+"-"+Math.floor(Math.random()*100);
            status = this._spawnCreep(body, name, {memory: memory, dryRun: true});
            if(status == OK) break;
        }

        return this._spawnCreep(body, name, {memory: memory});
    }
}
