// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater');
const path = require('node:path')
const url = require('url');
const log = require("electron-log");
const DiscordRPC = require('discord-rpc-electron');

log.transports.file.level = 'info';
log.initialize()
let update = false;
let mainWindow;

// Set this to your Client ID.
const clientId = '1199765277903175790';

// Only needed if you want to use spectate, join, or ask to join
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity(details, state) {
  if (!rpc || !mainWindow) {
    return;
  }

  // You'll need to have snek_large and snek_small assets uploaded to
  // https://discord.com/developers/applications/<application_id>/rich-presence/assets
  rpc.setActivity({
    details: details,
    state: state,
    startTimestamp,
    largeImageKey: 'icon_big',
    largeImageText: 'TSConnect',
    instance: false,
  });
}

rpc.on('ready', () => {
  log.info("[DISCORD RPC] Ready")

  let status = ["You play stupid games, you win stupid prizes", "RIP Me, I Died Dead", "You Could Lose Your Hand, You Could Lose Your Foot. You Could Lose Your Hand Getting It Off Your Foot! I Don’t Like Sea Urchins.","I'm a Doctor now so I know how breathing works", "I hate that stupid old pick-up truck you never let me drive."]

  let indet = "Browsing Dashboard";
  let insta = status[Math.floor(Math.random() * status.length)];
  setActivity(indet, insta)
});

rpc.login({ clientId }).catch(console.error);

log.errorHandler.startCatching()

function CheckForUpdate () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'TSConnect',
    width: 300,
    height: 500,
    icon: __dirname + '/public/img/icon.png',
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if(process.platform != 'darwin') {
    mainWindow.setMenu(null)
  }

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/public/version.html#v${app.getVersion()}`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  
}

function createWindow () {
  // If mainwindow somehow is undefined, create a new window and load the main index file
  if(mainWindow == undefined){
  // Create the browser window.
    mainWindow = new BrowserWindow({
      title: 'TSConnect',
      width: 950,
      height: 700,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    mainWindow.loadURL(`file://${__dirname}/public/index.html`);

    // window exists, and is actually hidden, then show the window.
  }else{
    if(!mainWindow.isVisible()){
      mainWindow.show();
    }
  }

  if(process.platform != 'darwin') {
    mainWindow.setMenu(null)
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  mainWindow.on('close', (e) => {
    if (mainWindow.forceClose) return;
    e.preventDefault();
    mainWindow.hide();
  });
  
}

app.on('before-quit', () => {
  mainWindow.forceClose = true;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log.info(`[App Version] ${app.getVersion()}`)
  log.info(`[IS TESTING] ${process.env["TSC_TESTING"]}`)
  log.info(`[PLATFORM] ${process.platform}`)

  //change this once able to be signed
  if(process.env["TSC_TESTING"] == "true"){
    log.info(`[AUTOUPDATE] Skipping autoupdater. PLATFORM: ${process.platform} | TSC_TESTING ENV: ${process.env["TSC_TESTING"] == undefined ? "Not Present" : process.env["TSC_TESTING"]}`)
    // CheckForUpdate()

    loadApp()
  }else{
    if(process.mas == true){
      log.info(`[MAS BUILD] Skipping AutoUpdate`)
      loadApp()
    }else{
      log.info(`[Version Check] Checking for Updates`)
      CheckForUpdate()
    }
    
  }
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0){
      mainWindow = undefined;
      createWindow();
    }else{
      createWindow();
    }
  })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  app.quit()
})


let det;
let sta;

ipcMain.on("sendRPC", (event, details, state) => {
  det = details;
  sta = state
})
setInterval(() => {
  if(mainWindow != undefined){
    setActivity(det, sta)
  }
}, 15000)

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

autoUpdater.on('checking-for-update', () => {
  log.info("Checking for updates using the following feed: " + autoUpdater.getFeedURL())
  sendStatusToWindow('102-Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('102-Update available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('102-Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  sendStatusToWindow(`101-${progressObj.percent}`);
})
autoUpdater.on('update-not-available', (info) => {
  loadApp()
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
  autoUpdater.quitAndInstall()
});

/**
 * Manager menu actions
 *
 * @param {String} type "Home", "Quizzes", "Tour", "Merch Alert", "Spotify", "Debug"
 */
function menuManager(type) {
  if(mainWindow == undefined)return;
  type = type.toLowerCase()
  if(type == "home"){
    mainWindow.loadURL(`file://${__dirname}/public/index.html`);
  }else if(type == "debug"){
    log.info("[Debug] Opening Developer Tools.")
    mainWindow.webContents.openDevTools();
  }else if(type == "action monitor"){
    mainWindow.loadURL(`file://${__dirname}/public/actionMonitor.html`);
  }else if(type == "about us"){
    mainWindow.loadURL(`file://${__dirname}/public/aboutus.html`);
  }
}

function loadApp(){
  if (process.platform == 'darwin'){
    log.info(`[MACOS Only] Registering Menu Items and Shortcuts`)
    let menuItems = [
      {
        label: 'TSConnect', 
        submenu: [
          {accelerator: "CommandOrControl+Shift+d", label: 'Debug', click: function () {
            menuManager("Debug")
          }},
          {type: 'separator'},
          {accelerator: "CommandOrControl+q", label: 'Quit', click: function() {app.quit();}},
          {accelerator: "CommandOrControl+w", label: 'Close Window', click: function() {
            if(mainWindow != undefined && mainWindow.isVisible() == true){
              mainWindow.close()
            }
          }},
          {accelerator: "CommandOrControl+t", label: 'Open Main Window', click: function() {
            if(mainWindow != undefined && mainWindow.isVisible() == false){
              mainWindow.show()
            }
          }}
        ]
      },{
        label: 'App Control', 
        submenu: [
          {accelerator:"Alt+CommandOrControl+h", label: 'Home', click: function () { 
            log.info("[SHORTCUT TRIGGERED] Navigating to Home")
            menuManager("Home")
          } },
          {accelerator:"Alt+CommandOrControl+m", label: 'Action Monitor', click: function () { 
            log.info("[SHORTCUT TRIGGERED] Navigating to Action Monitor")
            menuManager("Action Monitor")
          } },
          {accelerator:"Alt+CommandOrControl+a", label: 'About Us', click: function () { 
            log.info("[SHORTCUT TRIGGERED] Navigating to About Us")
            menuManager("About Us")
          } }
        ]
      }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuItems))
  }
  log.info(`[INFO] Loading Main Window`)
  createWindow()
}

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}
