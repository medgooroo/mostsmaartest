const { remote } = require('electron');
const { connect } = require('http2');
const WebSocket = require('ws');
let wSocket = null;
let streamSocket = null;
let udpserver = null;
let state = "discover";

class smaartAPI {
    constructor() {
        this.smaartServers = new Set();
    }
    listServers() {
        return this.smaartServers;
    }
    discoverServers(updateFn) {
        var PORT = 25752;
        var BROADCAST_ADDR = "255.255.255.255";
        var dgram = require('dgram');
        udpserver = dgram.createSocket("udp4");

        udpserver.bind(function () {
            udpserver.setBroadcast(true);
            setInterval(broadcastNew, 1000);
        });

        function broadcastNew() {
            if (state == "discover") {
                let buffer = new ArrayBuffer(8);
                let view = new DataView(buffer);
                view.setUint32(0, 0x656E7544, true); // smaart 0x73646179
                view.setUint32(0, 0x73646179, true); // smaart DI
                view.setUint16(4, 22322, true); // same port the demo client uses
                var message = Buffer.from(buffer);
                udpserver.send(message, 0, message.length, PORT, BROADCAST_ADDR);
                console.log("searching...");
            }
        };
        ///////////////////////// 
        var net = require('net');
        var server = net.createServer(handleConnection).listen(22322, '0.0.0.0', function () { // use 0.0.0.0 to force ipv4
            console.log('server listening to %j', server.address());
        });

        var self = this;
        function handleConnection(conn) {
            var remoteAddress = conn.remoteAddress;
            //  console.log('new client connection from %s', remoteAddress);
            //self.addServer(conn.remoteAddress, updateFn);
            conn.on('data', function (msg) {
                let port = msg[5] * 256 + msg[4];
                console.log("port: " + port);
                self.addServer(remoteAddress + ":" + port, updateFn);
            })
        }
        return this.smaartServers;
    }

    addServer(address, updateFn) {
        if (!this.smaartServers.has(address)) {
            this.smaartServers.add(address);
            updateFn(this.smaartServers);
        }
    }

    connectToServer(ip, errHandler, connectedHandler) {
        state = "connecting";
        let url = "ws://" + ip + "/api/v3/";
        console.log("connecting to: " + url);
        wSocket = new WebSocket(url);

        wSocket.onopen = connectedHandler;
        wSocket.onerror = function (event) {
            errHandler(event);
            // mainWindow.webContents.send("errors", event);
        }
        wSocket.onmessage = this.responseHandler;
    }

    responseHandler(event) {
        console.log(event.data);
    }

    request(payload) {
  
        console.log(JSON.stringify(payload));
          if (wSocket != undefined) {
            wSocket.send(JSON.stringify(payload));
        }
        else {
            console.log('not connected');
        }
    }

    startStream(ip, measurementName, streamHandler) {
        console.log("start stream @ " + ip);
        console.log("name: " + measurementName);
        let url ="ws://" +  ip + measurementName;
        streamSocket = new WebSocket(url);
        streamSocket.onmessage = streamHandler;
        
    }

}

module.exports = smaartAPI;