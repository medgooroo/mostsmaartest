// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// window.api.send("toMain", 'argh');

// console.log is to browser now, not node

window.api.receive("serverList", (data) => { // 
    let x = document.getElementById("serverSelect");
    x.length = 0;
    for (let [key, value] of data.entries()) {
        var option = document.createElement("option");
        option.text = key;
        x.add(option);
    }
});

window.api.receive("endPointList", (data) => {
    let x = document.getElementById("measurementStreams");
    x.length = 0;
    
    for (let spec in data[0]) {
        var option = document.createElement("option");
        option.text = data[0][spec].name;
        x.add(option);
    }
    for (let trans in data[1]) {
        var option = document.createElement("option");
        option.text = data[1][trans].name;
        x.add(option);
    }
})

window.api.receive("wsError", (data) => {
    document.getElementById("errors").innerText = data;
})

window.api.receive("streamData", (data) => {
    data = JSON.parse(data);
    const canvas = document.getElementById('spectrum');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    var barWidth = canvas.width / data.data.length;
    var barHeight = canvas.height / 130;
    for (var i = 0; i < data.data.length; i++) {
        ctx.strokeRect(i * barWidth, 0, barWidth, barHeight * -data.data[i][1])
    };
    ctx.stroke();
})


window.api.receive("wsConnect", (data) => {
    console.log("renderer: connected!");
    document.getElementById("connectButton").label = "connected!";
})

document.getElementById("connectButton").addEventListener("click", function () {
    console.log("calling connect from render");
    let e = document.getElementById("serverSelect");
    let ip = e.options[e.selectedIndex].text;
    window.api.send("smaart", ["connect", ip]);
});


document.getElementById("login").addEventListener("click", function () {
    window.api.send("smaart", ["login", "supersecret"]);
    window.api.send("smaart", ["getEndPointList"]);
});

document.getElementById("setDelay").addEventListener("click", function () {
    window.api.send("smaart", ["setDelay"]);
});

document.getElementById("startStream").addEventListener("click", function () { startStream() });


function startStream() {
    let e = document.getElementById("serverSelect");
    let ip = e.options[e.selectedIndex].text;
    window.api.send("smaart", ["stream", ip, "/api/v3/tabs/Default%20TF/measurements/Input%201"]);
}



let locations = new Array;
let minEast = 0;
let maxEast = 0;
let minNorth = 0;
let maxNorth = 0;

let lastMeasPos = {
    north: 0,
    east: 0,
    count: 0 // need a certain amount of counts withn the threshold distance
};


window.api.receive("gpsData", (data) => {
    //   console.log("gps data recieved");
    data.east = parseFloat(data.east);
    data.north = parseFloat(data.north);
    // is the distance to the last point more than the threshold ?
    let maxDistanceThreshold = 150; // in meters.
    let currDist = Math.sqrt(
        ((data.east - lastMeasPos.east) * ((data.east - lastMeasPos.east)) + ((data.north - lastMeasPos.north) * (data.north - lastMeasPos.north))
        ));
    console.log("currDist: " + currDist);
    if (currDist >= maxDistanceThreshold) {
        window.api.send("smaart", ["setDelay"]);        // update delay in smaart
        console.log("new position, reseting smaart delay");// reset averages?
        lastMeasPos.count = 0; // reset count
        lastMeasPos.east = data.east;
        lastMeasPos.north = data.north;
    }
    else lastMeasPos.count++;

    if (lastMeasPos.count > 5) {
        console.log("Got 5 points within threshold of: " + maxDistanceThreshold);
        // fit points to canvas.
        if (data.east > maxEast) maxEast = data.east;
        if (data.east < minEast) minEast = data.east;
        if (data.north > maxNorth) maxNorth = data.north;
        if (data.north < minNorth) minNorth = data.north;
        const canvas = document.getElementById('mapper');

        let eastScale = (canvas.width - 100) / (maxEast - minEast);
        let northScale = (canvas.height - 100) / (maxNorth - minNorth);
        let scale = Math.min(eastScale, northScale);

        locations.push(data);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        locations.forEach(element => {
            drawGradCircle(ctx, (canvas.width / 2) + element.east * scale, (canvas.height / 2) + element.north * scale, 50);
        });
    }

    var objText = document.getElementById("objOutput");
    var curText = objText.value;
    objText.value = curText + "\n" + data.north + " " + data.east + " " + data.up;

})



function drawGradCircle(ctx, x, y, r) {
    ctx.beginPath(); // AHHA - performance is shit without this.
    var grad = ctx.createRadialGradient(x, y, r / 50, x, y, r);
    grad.addColorStop(0, 'rgba(255,0,0,255)');
    grad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
}