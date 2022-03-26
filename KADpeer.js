/* By: Ryan Vickramasinghe */
const net = require("net");
const singleton = require("./utils/Singleton");
const path = require('path'); 
const handler = require("./utils/PeerHandler");
const KADPacket = require("./packetbuilder/KADPacket");

// first parse the arguments provided
let existingNetworkSettings = parseSettings(process.argv.slice(2));
singleton.init();

loadKADPeer(existingNetworkSettings);

/**
 * Starts the KADPeer node.
 */
function loadKADPeer(existingNetworkSettings) {
    // join an existing network if provided
    if (existingNetworkSettings != undefined) {
        console.log("[TEMP] Trying to join a new network.");
        joinAndCreateNetwork(existingNetworkSettings);
    } else {
        console.log("[TEMP] Creating root node.");
        createNetwork();
    }
}

/**
 * Parses command-line arguments.
 * @param {*} args the args provided from process.argv
 * @returns the parsed settings if a -p flag was set, or undefined if not
 */
function parseSettings(args) {
    // check to see if no args provided (start new network)
    if (args.length === 0) {
        return undefined;
    }
    // parse the -p flag
    else if(args.length === 2) { //TODO: deal with version flag
        const peerParsed = args[1].split(":");

        if (peerParsed.length != 2) 
            throw "Invalid peer provided! Should be of form <ip>:<port>";

        return {
            ip : peerParsed[0],
            port : parseInt(peerParsed[1]),
            id : singleton.getPeerID(peerParsed[0], parseInt(peerParsed[1])),
            name : path.basename(process.cwd())
        };
    } 
    else {
        throw "Invalid args provided!";
    }
}


/**
 * Sets up and joins a network, then sends a join kadPTP request.
 * @param {net.Socket} clientSocket the client socket to connect to
 * @param {*} existingNetworkSettings the settings of the network to join
 */
function joinAndCreateNetwork(existingNetworkSettings) {
    const clientSocket = net.Socket();
    clientSocket.connect({ 
        port: existingNetworkSettings.port, 
        host: existingNetworkSettings.ip
    }, () => {
        console.log("Initiated connection to " + 
            `${existingNetworkSettings.ip}:${existingNetworkSettings.port}`);

        createNetwork(clientSocket.localPort, clientSocket.localAddress, 
            existingNetworkSettings);
    });

    handler.handleUpdate(clientSocket);
}


/**
 * Creates a new server on the provided Socket, listening on provided host
 *  and a random port.
 * @param {net.Socket} serverSocket 
 * @returns returns the settings object for the newly created server
 */
 function createNetwork(port = 0, host = "127.0.0.1", 
    existingNetworkSettings = undefined) {
    const serverSocket = net.createServer();

    // assign a random port or use one provided and listen on it
    serverSocket.listen(port, host, function() {
        const settings = {
            ip : host,
            port : parseInt(serverSocket.address().port),
            id : singleton.getPeerID(host, parseInt(serverSocket.address().port)),
            name : path.basename(process.cwd())
        };
        handler.init(settings, existingNetworkSettings);

        console.log(`This peer address is ${settings.ip}:${settings.port} ` + 
            `located at ${settings.name} [${settings.id}]`);
    });

    // call the handler whenever a new peer connects to this network
    serverSocket.on('connection', function(sock) {
        handler.handleClientJoining(sock);
    });
}
