// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, globalShortcut } = require('electron')
const { autoUpdater } = require('electron-updater');
const path = require('node:path')
const url = require('url');
const log = require("electron-log")

log.initialize()

let mainWindow;

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}


function CheckForUpdate () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'TSConnect',
    width: 300,
    height: 500,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })


  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/public/version.html#v${app.getVersion()}`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  
}

function createWindow () {
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


  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/public/index.html#v${app.getVersion()}`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  

  log.info(`[App Version] ${app.getVersion()}`)
  log.info(`[Version Check] Checking for Updates`)
  autoUpdater.checkForUpdatesAndNotify();
  if(process.env["TSC_TESTING"] == "true"){
    loadApp()
  }else{
    CheckForUpdate()
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

autoUpdater.on('checking-for-update', () => {
  log.info("Checking for updates using the following feed: " + autoUpdater.getFeedURL())
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available. Starting TSConnect.');

  loadApp()
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
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
  }
}

function loadApp(){
  log.info(`[INFO] Registering Menu Items and Shortcuts`)
  let menuItems = [
    {
      label: 'TSConnect', 
      submenu: [
        {label: 'Debug', click: function () {
          menuManager("Debug")
        }},
        {type: 'separator'},
        {accelerator: "Cmd+qOrControl+q", label: 'Quit', click: function() {app.quit();}}
      ]
    },{
      label: 'App Control', 
      submenu: [
        {accelerator:"Cmd+hOrControl+h", label: 'Home', click: function () { 
          log.info()
          menuManager("Home")
        } },
        {type: 'separator'},
        {accelerator: "Cmd+qOrControl+q", label: 'Quit', click: function() {app.quit();}}
      ]
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuItems))

  globalShortcut.register('Command+hOrControl+h', () => {
    menuManager("Home")
  })

  globalShortcut.register('Command+qOrControl+q', () => {
    app.quit()
  })

  log.info(`[INFO] Loading Main Window`)
  createWindow()
}
