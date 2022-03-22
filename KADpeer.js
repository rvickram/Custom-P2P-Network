/* By: Ryan Vickramasinghe */
const net = require("net");
const singleton = require("./utils/Singleton");
const handler = require("./PeerHandler");

const HOST = "127.0.0.1";

// first parse the arguments provided
let settings = parseSettings(process.argv);
singleton.init();

let peer = undefined;
if (settings == undefined) {
    peer = new net.createServer();

    peer.listen(0, HOST, function() {
        settings = {
            ip : HOST,
            port : peer.address().port,
            id : singleton.getPeerID(HOST, peer.address().port),
            name : handler.getPeerCount()
        };

        console.log(`This peer address is ${settings.ip}:${settings.port} ` + 
            `located at peer${settings.name} [${settings.id}]`);
    });
} else {
    console.log("Join function not implemented yet.");
}

function parseSettings(args) {
    // check to see if no args provided (start new network)
    if (args.length === 2) {
        console.log("Creating new network.");
        return undefined;
    } 
    // parse the -p flag
    else if(args.length === 4) {
        console.log(`Attempting to join peer ${args[3]}`);

        const peerParsed = args[3].split(":");

        if (peerParsed.length != 2) 
            throw "Invalid peer provided! Should be of form <ip>:<port>";

        return {
            ip : peerParsed[0],
            port : peerParsed[1],
            id : singleton.getPeerID(peerParsed[0], peerParsed[1]),
            name : handler.getPeerCount()
        };
    } 
    else {
        throw "Invalid args provided!";
    }
}
