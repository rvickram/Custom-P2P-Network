/* By: Ryan Vickramasinghe */
const net = require('net');
const singleton = require("../utils/Singleton");
const KADPacket = require("../packetbuilder/KADPacket");

var peerCount = 1;
var config = undefined;
var dht = undefined;

module.exports = {
    /**
     * This function initializes a new DHT table
     */
    init: function(settings) {
        config = settings;
        dht = Array(160).fill(Array(1).fill(undefined));
    },

    /**
     * Returns the number of peers in this network.
     * @returns a Number value containing the number of peers in this network
     */
    getPeerCount: function() { return peerCount },

    /**
     * This function gets called whenever a new peer joins the network.
     * @param {net.Socket} socket 
     */
    handleClientJoining: function(socket) {
        console.log(`Received connection from ${socket.remoteAddress}:${socket.remotePort}`);
        const welcomePacket = new KADPacket(7, 1, peerCount, config.name, formatPeerData(dht));
        // socket.write(welcomePacket.getPacketBits());
    }
};

function pushBucket(dht, newPeer) {

}

/**
 * 
 * @param {Array} dht The DHT (2D array) to be converted
 * @returns Array of formatted peer data
 */
function formatPeerData(dht) {
    return []; // TODO: Format the known peers
}
