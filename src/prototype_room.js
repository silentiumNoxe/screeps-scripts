Object.defineProperty(Room.prototype, "mySpawns", {
    get(){
        if(!this._mySpawns){
            this._mySpawns = this.find(FIND_MY_SPAWNS);
        }

        return this._mySpawns;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, "myExtensions", {
    get(){
        if(!this._myExtensions){
            this._myExtensions = this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}});
        }

        return this._myExtensions;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, "containers", {
    get(){
        if(!this._containers){
            this._containers = this.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
        }

        return this._containers;
    },
    enumerable: false,
    configurable: true
})

Object.defineProperty(Room.prototype, "myStorages", {
    get(){
        if(!this._myStorages){
            this._myStorages = this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}});
        }

        return this._myStorages;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, "myTowers", {
    get(){
        if(!this._myTowers){
            this._myTowers = this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        }

        return this._myTowers;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, "sources", {
    get(){
        if(!this._sources){
            this._sources = this.find(FIND_SOURCES);
        }

        return this._sources;
    },
    enumerable: false,
    configurable: true
});
