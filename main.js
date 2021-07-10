

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const smaartAPI = require("./smaart.js");


const path = require('path')
let mainWindow = null;

let sApi = new smaartAPI();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

    // Open the DevTools.

    //mainWindow.webContents.openDevTools()
    ;
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  sApi.discoverServers(updateServerList);

})


function updateServerList(serverList) {
  console.log("found a Server")
  mainWindow.webContents.send("serverList", serverList);
}

function errorHandler(error) {
  console.log("error!");
  mainWindow.webContents.send("wsError", error.message);
}

function connectedHandler() {
  console.log("connected?");
  mainWindow.webContents.send("wsConnect", "success");
}

function streamHandler(data) {
  mainWindow.webContents.send("streamData", data.data)
  //console.log(data.data);

}


ipcMain.on('smaart', (event, command) => {
  switch (command[0]) {
    case "connect":
      sApi.connectToServer(command[1], errorHandler, connectedHandler);
      break;
    case "request":
      sApi.request(command[1]);
      break;
    case "stream":
      sApi.startStream(command[1], command[2], streamHandler);
      break;
    case "login":
      sApi.login(command[1]);
      break;
    case "setDelay":
      sApi.setDelay();
      break;
  }
});

const gpsClient = require("./gpsClient.js");
let gps = new gpsClient();
gps.startTestServer();
gps.startClient("127.0.0.1", "12345", function (data) {
  mainWindow.webContents.send("gpsData", data);
  // console.log("handling");
});

// /api/v3/tabs/Default%20TF/measurements/Input%201

// find the smaart server.
// connect to it.
// bson seems the most popular json crusher thing.

// find the (local?) rtknavi server.  - passed in arg option? just use localhost for now.
// if enough time has passed and we're getting a fix from the rtknavi
// recalc and apply time offset on the measurement.

// record timestamp, location from gps server and transfer result from smaart.
// then some kind of wonderful solution for plotting this. )
// plot the response at the current selected frequency band on the canvas.
// scale the image on the canvas to cover the gps points recorded

