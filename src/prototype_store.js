Store.prototype.isEmpty = function (resource) {
    return this[resource] === 0;
};

Store.prototype.isFull = function (resource){
    return this.getFreeCapacity(resource) === 0;
};