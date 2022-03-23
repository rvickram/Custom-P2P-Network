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
            port: socket.remotePort,
            id: singleton.getPeerID(socket.remoteAddress, socket.remotePort)
        };
        pushBucket(dht, newPeer);

        // create welcome packet
        const welcomePacket = new KADPacket(
            7, 1, peerCount, config.name, dht.filter(val => val != undefined)
        );
        socket.write(welcomePacket.getPacketBytes());

        socket.end();
    }
};


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

    console.log("\nHexID=" + newPeer.id + "\n\tBinary ID=" + newPeerIdBits + "\n\tlength=" + newPeerIdBits.length);
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
