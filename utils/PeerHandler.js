/* By: Ryan Vickramasinghe */
const net = require('net');
const singleton = require("../utils/Singleton");
const KADPacket = require("../packetbuilder/KADPacket");

var peerCount = 0;
var config = undefined;
var idBits = undefined;
var dht = undefined;

module.exports = {
    /**
     * This function initializes a new DHT table
     */
    init: function (settings, existingNetworkSettings) {
        config = settings;
        idBits = singleton.Hex2Bin(settings.id);
        dht = Array(160).fill(undefined);

        if (existingNetworkSettings != undefined) {
            pushBucket(dht, existingNetworkSettings);
        }
    },

    /**
     * Returns the number of peers in this network.
     * @returns a Number value containing the number of peers in this network
     */
    getPeerCount: function () { return peerCount },

    /**
     * This function gets called whenever a new peer joins the network (send a welcome message)
     * @param {net.Socket} socket 
     */
    handleClientJoining: function (socket) {
        console.log(`Received connection from peer ${socket.remoteAddress}:${socket.remotePort}`);
        // add to bucket
        const newPeer = {
            ip: socket.remoteAddress,
            port: parseInt(socket.remotePort),
            id: singleton.getPeerID(socket.remoteAddress, parseInt(socket.remotePort))
        };
        pushBucket(dht, newPeer);

        // create welcome packet (don't send the DHT entry containing the new peer)
        const peerData = dht.filter(val => val != undefined && val.id != newPeer.id);
        const welcomePacket = new KADPacket({
            version: 7,
            messageType: 1,
            numPeers: peerData.length,
            senderName: config.name,
            peerData: peerData
        });
        socket.write(welcomePacket.getPacketBytes());

        socket.end();
    },

    handleUpdate: function (clientSocket) {
        // When receiving data
        clientSocket.on("data", (data) => {
            // parse the raw packet
            const packet = new KADPacket({ rawPacket: data });

            // check version and to see if there are even any peers
            if (packet.getVersion() == 7) {
                // if this is a welcome packet, parse the peers
                if (packet.getMessageType() == 1) {
                    console.log(`\nReceived welcome packet from ${packet.getSenderName()}\n` +
                        "along with DHT: " + packet.printPeersAsString());
                    refreshBucket(dht, packet.getPeers());
                }
            }
        });

        // when remote endpoint closed connection
        clientSocket.on("close", (hadError) => {
            console.log("Connection was closed by " + clientSocket.remoteAddress +
                ":" + clientSocket.remotePort);
            clientSocket.end();
        });
    }
};

function refreshBucket(dht, newPeers) {
    for (let i = 0; i < newPeers.length; i++) {
        newPeers[i].id = singleton.getPeerID(newPeers.ip, newPeers.port);
        pushBucket(dht, newPeers[i]);
    }

    console.log("Refresh k-bucket operation is performed.\n\n" + "My DHT: ", dht.filter(val => val != undefined));
}


/**
 * This function handles adding new peers and updated the DHT.
 * @param {Array} dht The DHT to update
 * @param {*} newPeer The newPeer to try and add
 */
function pushBucket(dht, newPeer) {
    const newPeerIdBits = singleton.Hex2Bin(newPeer.id);

    let foundMatch = false;
    for (let i = 160; i > 0; i--) {
        // found a match
        if (newPeerIdBits.slice(0, i) == idBits.slice(0, i)) {
            updateBucket(dht, newPeer, i);
            foundMatch = true;
            peerCount++;
            break;
        }
    }

    // if there were no matches, put into the 0th bucket
    if (!foundMatch) {
        updateBucket(dht, newPeer, 0);
        peerCount++;
    }
}


/**
 * This is a helper function called by pushBucket(). It handles the actual update.
 * @param {Array} dht The DHT to update
 * @param {*} newPeer The newPeer to try and add
 * @param {*} i The index of the DHT to update.
 */
function updateBucket(dht, newPeer, i) {
    const bucket = dht[i];

    // if empty, just insert the new peer
    if (bucket === undefined) {
        dht[i] = newPeer;
    }
    // bucket is full, check distance and replace if closer
    else {
        const bucketIdBits = singleton.Hex2Bin(bucket.id);
        const currentDistance = singleton.XORing(idBits, bucketIdBits);
        const newDistance = singleton.XORing(idBits, singleton.Hex2Bin(newPeer.id));

        // if closer replace, otherwise, do nothing
        if (newDistance < currentDistance) {
            dht[i] = newPeer;
        }
    }
}

/**
 * 
 * @param {Array} dht The DHT (2D array) to be converted
 * @returns Array of formatted peer data
 */
function formatPeerData(dht) {
    if (peerCount == 0) return undefined;
}
