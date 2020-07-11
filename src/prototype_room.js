Object.defineProperty(Room.prototype, "spawn", {
    get(){
        if(!this._spawn){
            this._spawn = this.find(FIND_MY_SPAWNS)[0];
        }

        return this._spawn;
    },
    enumerable: false,
    configurable: true
})
