/* By: Ryan Vickramasinghe */
const net = require('net');
const singleton = require("../utils/Singleton");

let peerCount = 1;

module.exports = {
    /**
     * This function initializes a new DHT table
     */
    init: function() {
        //TODO
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
        console.error("handleClientJoining() not implemented"); //TODO
    }
}