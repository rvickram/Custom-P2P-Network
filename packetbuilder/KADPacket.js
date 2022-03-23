/* By: Ryan Vickramasinghe */
const singleton = require("../utils/Singleton");

class KADPacket {
    constructor(version = undefined, messageType = undefined, numPeers = undefined,
        senderName = undefined, peerData = undefined, rawPacket = undefined) {
        if (rawPacket != undefined) {
            this.packet = parseRawPacket(rawPacket);
        } else {
            this.packet = {
                header: {
                    version: version,
                    messageType: messageType,
                    numPeers: numPeers,
                    lenSenderName: getLenSenderName(senderName),
                    senderName: senderName,
                },
                payload: peerData
            }
        }
    }

    // getVersion() {
    //     return this.packet.header.version;
    // }

    // getMessageType() {
    //     return this.packet.header.messageType;
    // }

    // getNumPeers() {
    //     return this.packet.header.messageType;
    // }

    // getSenderName() {
    //     return this.packet.header.senderName;
    // }

    getPacketBytes() {
        const lenSenderName = this.packet.header.lenSenderName;
        let packetBits = {
            header: new Uint8Array(8 + lenSenderName),
            payload: undefined
        }

        storeBitPacket(packetBits.header, this.packet.header.version, 0, 4);
        storeBitPacket(packetBits.header, this.packet.header.messageType, 4, 12);
        storeBitPacket(packetBits.header, this.packet.header.numPeers, 12, 20);

        storeBitPacket(packetBits.header, lenSenderName, 20, 32);
        storeBitPacket(packetBits.header, this.packet.header.senderName, 32, 32 + lenSenderName);

        if (this.packet.payload != undefined) {
            packetBits.payload = new Uint8Array(this.packet.header.numPeers * 6);

            for (let i = 0; i < this.packet.payload.length; i++) {
                const bucket = this.packet.payload[i];

                const offset = i*6;
                storeBitPacket(packetBits.payload, bucket.ip, offset, 4 + offset);
                storeBitPacket(packetBits.payload, bucket.port, 4 + offset, 6 + offset);
            }
        }

        return (packetBits.payload == undefined) ?
            packetBits.header : new Uint8Array([...packetBits.header, ...packetBits.payload]);
    }

}

/**
 * This function takes the raw packet from a socket and parses it.
 * @param {Uint8Array} rawPacket The raw packet in bits
 * @returns a parsed packet object
 */
function parseRawPacket(rawPacket) {
    const packet = {
        header: {
            version: parseBitPacket(rawPacket, 0, 4),
            messageType: parseBitPacket(rawPacket, 4, 12),
            numPeers: parseBitPacket(rawPacket, 12, 20),
            lenSenderName: parseBitPacket(rawPacket, 20, 32),
        },
        payload: bytesToString(rawPacket.slice(12))
    }
    packet.header.senderName = parseBitPacket(rawPacket, 32, 32 + packet.header.lenSenderName);

    return packet;
}

function getLenSenderName(senderName) {
    const senderNameBytes = stringToBytes(senderName);
    return senderNameBytes.length * 8;
}

// Returns the integer value of the extracted bits fragment for a given packet
function parseBitPacket(packet, offset, length) {
    let number = "";
    for (var i = 0; i < length; i++) {
        // let us get the actual byte position of the offset
        let bytePosition = Math.floor((offset + i) / 8);
        let bitPosition = 7 - ((offset + i) % 8);
        let bit = (packet[bytePosition] >> bitPosition) % 2;
        number = (number << 1) | bit;
    }
    return number;
}

// Prints the entire packet in bits format
function printPacketBit(packet) {
    var bitString = "";

    for (var i = 0; i < packet.length; i++) {
        // To add leading zeros
        var b = "00000000" + packet[i].toString(2);
        // To print 4 bytes per line
        if (i > 0 && i % 4 == 0) bitString += "\n";
        bitString += " " + b.substr(b.length - 8);
    }
    console.log(bitString);
}

// Converts byte array to string
function bytesToString(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}

// Store integer value into specific bit poistion the packet
function storeBitPacket(packet, value, offset, length) {
    // let us get the actual byte position of the offset
    let lastBitPosition = offset + length - 1;
    let number = value.toString(2);
    let j = number.length - 1;
    for (var i = 0; i < number.length; i++) {
        let bytePosition = Math.floor(lastBitPosition / 8);
        let bitPosition = 7 - (lastBitPosition % 8);
        if (number.charAt(j--) == "0") {
            packet[bytePosition] &= ~(1 << bitPosition);
        } else {
            packet[bytePosition] |= 1 << bitPosition;
        }
        lastBitPosition--;
    }
}

// Convert a given string to byte array
function stringToBytes(str) {
    var ch,
        st,
        re = [];
    for (var i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i); // get char
        st = []; // set up "stack"
        do {
            st.push(ch & 0xff); // push byte to stack
            ch = ch >> 8; // shift value down by 1 byte
        } while (ch);
        // add stack contents to result
        // done because chars have "wrong" endianness
        re = re.concat(st.reverse());
    }
    // return an array of bytes
    return re;
}

module.exports = KADPacket;
