const fs = require("fs")
const packageInfo = require("./info.json")
let file = require("./package-template.json")

// Sync the dependencies with the package info config
file["dependencies"] = packageInfo["dependencies"]
file["devDependencies"] = packageInfo["devDependencies"]
file["scripts"] = packageInfo["scripts"]

// Set versions and build numbers
file["version"] = packageInfo["version"]
file["build"]["mac"]["bundleVersion"] = packageInfo["buildNumber"]

// If set build type is dmg, configure package.json to be publishing using dmg
// If set build type is mas, configure package.json to be using mas
if(packageInfo["buildType"] == "dmg"){
    file["build"]["mac"]["target"] = [
        "dmg",
        "zip"
    ]
    file["build"]["mac"]["provisioningProfile"] = undefined;
}else if(packageInfo["buildType"] == "mas"){
    file["build"]["mac"]["target"] = [
        "mas"
    ]
    if(packageInfo["isDist"]){
        file["build"]["mac"]["provisioningProfile"] = "buildAssets/certs/TSConnect.provisionprofile"
        file["build"]["mas"]["type"] = "distribution"
    }else{
        file["build"]["mac"]["provisioningProfile"] = "buildAssets/certs/TSConnect_Test.provisionprofile"
        file["build"]["mas"]["type"] = "development"
    }
}else if(packageInfo["buildType"] == "win"){
    file["build"]["win"]["target"] = [
        "nsis"
    ]
}

fs.writeFileSync(__dirname + "/package.json", JSON.stringify(file, null, 4))

console.log("set")