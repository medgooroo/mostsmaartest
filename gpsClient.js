var net = require('net');

class gpsClient {
    startTestServer() {
        var server = net.createServer();
        server.on('connection', handleConnection);
        server.listen(12345, function () {
            console.log('server listening to %j', server.address());
        });

        function handleConnection(conn) {
            console.log('new client connection from %s', conn.remoteAddress);
            sendTestData(conn);
            conn.on('data', onConnData);
            conn.once('close', onConnClose);
            conn.on('error', onConnError);
            function onConnData(d) {
                console.log('connection data from %s: %j', conn.remoteAddress, d);
            }
            function onConnClose() {
                console.log('connection from %s closed', conn.remoteAddress);
            }
            function onConnError(err) {
                console.log('Connection %s error: %s', conn.remoteAddress, err.message);
            }
        }
        function sendTestData(conn) {
            setInterval(function () {
                if (conn != undefined) {
                    conn.write("2021/05/30 23:26:11.000         " + (Math.random()*140 -50 ).toString() + "         "+ ((Math.random() * 100) - 50).toString() + "        -0.2832   1  12   0.1168   0.1052   0.1565  -0.0052  -0.0446  -0.0785   2.01    1.1\n\r") // generic bit o test data 
                }
            }, 100);

        }
    }
    startClient(host, port, dataHandler) {
        var client = new net.Socket();
        client.connect({
            port: port,
            host: host
        });
        client.setEncoding('utf-8');
        client.on('connect', function () {
            console.log('gps: connection established with server');
        });

        client.on('data', function (data) {
        //    console.log('Data from gps server:' + data);
            let res = data.split(/\s{2,}/); // timestamp has a space to be a nuisance.
            //console.log(res);
            let response = {
                timestamp: res[0],
                east: res[1],
                north: res[2],
                up: res[3],
                state: res[4],
                numSats: res[5],
                stdde: res[6],
                stddn: res[7],
                stddu: res[8],
                age: res[12],
                ratio: res[13]
            }
            
            /////////////////////////////////////////////////////////////////////
            // really basic approach.
            // number of sats and ratio might be relevant.
            if (response.state == 1) { // location has "fix"
                dataHandler( response );
            }
           // dataHandler(response);
            /////////////////////////////////////////////////////////////////////

        });

        client.on('end', () => {
            console.log('disconnected from gps server');
        });

    }


}

module.exports = gpsClient;