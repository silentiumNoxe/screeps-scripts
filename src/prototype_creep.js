Object.defineProperty(Creep.prototype, "spawn", {
    get(){
        if(!this.memory.spawnName || this.memory.spawnName == "") return;
        if(!this._spawn){
            this._spawn = Game.spawns[this.memory.spawnName];
        }

        return this._spawn;
    },
    enumerable: false,
    configurable: true
});
