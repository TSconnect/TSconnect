let info = require("./info.json")
const fs = require("fs")
const prompt = require('prompt-sync')({sigint: true});
  
let version = prompt('Build Version:')
info["version"] = version

let buildNumber = prompt('Build Number:')
info["buildNumber"] = buildNumber

let type = prompt('Build Type(dmg or mas):')
info["buildType"] = type

let isDist = prompt('Is Distribution(y/n):')
info["isDist"] = isDist.toLowerCase() == "y" ? true : false;

fs.writeFileSync(__dirname + "/info.json", JSON.stringify(info, null, 4))