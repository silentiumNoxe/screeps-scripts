module.exports.creeps = (namePrefix, todo={return: true}) => {
    let res = Object.entries(([key,value]) => key.startsWith(namePrefix));
    if(typeof todo == "object" && todo.return) return res.map(([key, value]) => value);
    else if(typeof todo == "function") res.forEach(([key, value]) => todo(value));
}
