RoomPosition.prototype.getFreePlace = function(){
    if(this.isFree()) return this;

    let pos;

    pos = new RoomPosition(this.x, this.y -1, this.roomName);//TOP
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x +1, this.y -1, this.roomName);//TOP_RIGHT
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x +1, this.y, this.roomName);//RIGHT
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x +1, this.y +1, this.roomName);//RIGHT_BOTTOM
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x, this.y +1, this.roomName);//BOTTOM
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x -1, this.y +1, this.roomName);//BOTTOM_LEFT
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x -1, this.y, this.roomName);//LEFT
    if(pos.isFree()) return pos;

    pos = new RoomPosition(this.x -1, this.y -1, this.roomName);//LEFT_TOP
    if(pos.isFree()) return pos;
};

RoomPosition.prototype.isFree = function(){
    const look = this.look();
    for(const a of look){
        if(a.type === LOOK_FLAGS){
            if(a[LOOK_FLAGS].color === COLOR_WHITE && a[LOOK_FLAGS].secondaryColor === COLOR_WHITE) return false;
        }

        if(a.type === LOOK_TERRAIN){
            if(a[LOOK_TERRAIN] === "wall") return false;
        }

        if(a.type === LOOK_CREEPS) return false;

        if(a.type === LOOK_STRUCTURES){
            if(a[LOOK_STRUCTURES].structureType !== STRUCTURE_ROAD && a[LOOK_STRUCTURES].structureType !== STRUCTURE_RAMPART) return false;
        }

        if(a.type === LOOK_SOURCES) return false;
    }

    return true;
};