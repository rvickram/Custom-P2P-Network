/* By: Ryan Vickramasinghe */

class KADPacket {
    constructor(packet) {
        if (packet.rawPacket) {
            this.packet = parseRawPacket(packet.rawPacket);
        } else {
            this.packet = {
                header: {
                    version: packet.version,
                    messageType: packet.messageType,
                    numPeers: packet.numPeers,
                    lenSenderName: getLenSenderNameBits(packet.senderName),
                    senderName: packet.senderName,
                },
                payload: packet.peerData
            }
        }

        console.log("\nLoaded packet: ", this.packet);
    }

    getVersion() {
        return this.packet.header.version;
    }

    getMessageType() {
        return this.packet.header.messageType;
    }

    getNumPeers() {
        return this.packet.header.numPeers;
    }

    getSenderName() {
        return this.packet.header.senderName;
    }

    getPeers() {
        return this.packet.payload;
    }

    getPacketBytes() {
        let packetBits = {
            header: new Uint8Array(4),
            payload: undefined
        }

        storeBitPacket(packetBits.header, this.packet.header.version, 0, 4);
        storeBitPacket(packetBits.header, this.packet.header.messageType, 4, 8);
        storeBitPacket(packetBits.header, this.packet.header.numPeers, 12, 8);
        storeBitPacket(packetBits.header, this.packet.header.lenSenderName, 20, 12);

        // append the senderName to the header
        const senderNameBytes = new Uint8Array(stringToBytes(this.packet.header.senderName));
        packetBits.header = new Uint8Array([...packetBits.header, ...senderNameBytes]);

        // handle the payload conversion
        if (this.packet.payload != undefined) {
            packetBits.payload = new Uint8Array(0);

            for (let i = 0; i < this.packet.payload.length; i++) {
                const bucket = this.packet.payload[i];

                const ipArray = new Uint8Array(bucket.ip.split("."));
                packetBits.payload = new Uint8Array([...packetBits.payload, ...ipArray]);
                const portArray = new Uint8Array(2);
                storeBitPacket(portArray, parseInt(bucket.port), 0, 16);
                packetBits.payload = new Uint8Array([...packetBits.payload, ...portArray]);
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
            messageType: parseBitPacket(rawPacket, 4, 8),
            numPeers: parseBitPacket(rawPacket, 12, 8),
            lenSenderName: parseBitPacket(rawPacket, 20, 12),
        },
        payload: undefined
    }
    packet.header.senderName = bytesToString(rawPacket.slice(4, 4 + Math.ceil(packet.header.lenSenderName / 8)));

    // parse out the payload based on numPeers
    packet.payload = [];
    if (packet.header.numPeers > 0) {
        const rawPayload = rawPacket.slice(4 + Math.ceil(packet.header.lenSenderName / 8));

        for (let i = 0; i < packet.header.numPeers; i++) {
            const offset = i * 6;

            const newPeer = {
                ip: rawPayload.slice(offset, 4 + offset).join("."),
                port: parseBitPacket(rawPayload, offset * 8 + 32, 16)
            }

            packet.payload.push(newPeer);
        }
    }

    return packet;
}

function getLenSenderNameBits(senderName) {
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
