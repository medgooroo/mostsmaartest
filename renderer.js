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

document.getElementById("connectButton").addEventListener("click", function () { connectToServer() });
document.getElementById("doSomething").addEventListener("click", function () { login() });
document.getElementById("setDelay").addEventListener("click", function () { setDelay() });
document.getElementById("startStream").addEventListener("click", function () { startStream() });


function connectToServer() {
    console.log("calling connect from render");
    let e = document.getElementById("serverSelect");
    let ip = e.options[e.selectedIndex].text;
    window.api.send("smaart", ["connect", ip]);
}

function startStream() {
    let e = document.getElementById("serverSelect");
    let ip = e.options[e.selectedIndex].text;
    window.api.send("smaart", ["stream", ip, "/api/v3/tabs/Default%20TF/measurements/Input%201"]);
}

function login() {
    let payload =
    {
        "action": "set",
        "properties": [{ "password": "supersecret" }]
    };
    window.api.send("smaart", ["request", payload]);// login
}

function setDelay() {
    let payload =
    {
        "action": "findDelay",
        "target": { "measurementName": "Default TF" },
        "properties": [
            { "automaticallyStart": true },
            { "automaticallyInsert": true },
            { "automaticallyStop": false }
        ]
    };
    window.api.send("smaart", ["request", payload]);// login
}


window.api.receive("gpsData", (data) => { 
    // alrighty then.
    // is the data new? 
    // maybe just record everthing for now - its only 3600 points an hour.
    // a lovely button to write this to an obj file?
    var objText = document.getElementById("objOutput");
    var curText = objText.value;
    objText.value = curText + "\n" + data.north + " " + data.east + " " + data.up;
      

    const canvas = document.getElementById('mapper');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGradCircle(ctx, data.east, data.north, 50);
    //drawGradCircle(ctx, 210, 100, 10);

})


function drawGradCircle(ctx, x,y, r) {
    var grad = ctx.createRadialGradient(x, y, r/50, x, y, r);
    grad.addColorStop(0, 'rgba(255,0,0,255)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.arc(x, y, r, 0, Math.PI*2, false);
        ctx.fillStyle = grad;
    ctx.fill();
    }