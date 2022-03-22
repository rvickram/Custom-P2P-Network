/* By: Ryan Vickramasinghe */
const singleton = require("./utils/Singleton");

let peerCount = 1;

module.exports = {
    getPeerCount: function() { return peerCount }
}