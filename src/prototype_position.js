if(!RoomPosition.prototype._lookFor){
    RoomPosition.prototype._lookFor = RoomPosition.prototype.lookFor;

    RoomPosition.prototype.lookFor = function(type, {filter}={}){
        let res = this._lookFor(type);
        if(filter == null) return res;
        return res.filter(filter);
    }
}
