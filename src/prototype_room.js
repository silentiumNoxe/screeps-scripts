Object.defineProperty(Room.prototype, "mySpawn", {
    get(){
        if(!this._mySpawn){
            this._mySpawn = this.find(FIND_MY_SPAWNS)[0];
        }

        return this._mySpawn;
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

Object.defineProperty(Room.prototype, "myContainers", {
    get(){
        if(!this._myContainers){
            this._myContainers = this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
        }

        return this._myContainers;
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
