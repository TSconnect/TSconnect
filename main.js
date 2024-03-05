// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const Notify = require('node-notifier').NotificationCenter;
const appConfig = require("./config.json")
const axios = require('axios');
let clientKey;
const { 
  v4: uuidv4,
} = require('uuid');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('node:path')
const log = require('./logger');



// define necessary variables
let mainWindow;
const store = new Store();
const notifier = new Notify({
  withFallback: false,
  customPath: path.join(__dirname, "./node_modules/node-notifier/vendor/mac.noindex/TSConnect.app/Contents/MacOS/TSConnect")
})
let readyForNotification = false;





// start catching errors





// set before quit
app.on('before-quit', () => {
  mainWindow.forceClose = true;
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  log.info(`[App Version] ${app.getVersion()}`)
  log.info(`[IS TESTING] ${process.env["TSC_TESTING"]}`)
  log.info(`[PLATFORM] ${process.platform}`)
  log.info(`[CONFIG LOCATION] "${store.path}"`)
  log.info(`[LOG LOCATION] ${log.transports.file.getFile()}`)
  checkBackendUp()

  if(checkForFirstRun()){
    log.log("[CLIENT REGISTRATION] First Run, Registrating ClientKey")
    let id = uuidv4();
    let cKey = await registerClientKey(id)
    let key = (cKey).data.registeredKey.key;
    store.set("clientKey", key)
    store.set("isFirstLaunch", false)
  }else{
    if(!(await checkRegistration(store.get("clientKey")))){
      log.log("[CLIENT REGISTRATION] Reregistrating ClientKey")
      let id = uuidv4();
      let cKey = await registerClientKey(id)
      let key = (cKey).data.registeredKey.key;
      store.set("clientKey", key)

    }
  }
  log.info(`[CLIENT KEY] ${store.get("clientKey")}`)
  clientKey = store.get("clientKey")

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
      loadApp()
      loadApp()
    }
    
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0){
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


// Loops

setInterval(async () => {
  if(store.get("clientKey") != undefined && readyForNotification){
    checkBackendUp()
    let key = store.get("clientKey")
    checkRegistration(key)
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://tsconnect.taylorcentral.live/api/v1/contents/notification',
      headers: { 
        'clientKey': key
      }
    };
    
    let data = await axios.request(config)
    data=data.data
    if(data.success){
      data = data.data
      if(!data.notified.includes(key)){
        notify(data.title, data.description, data.sound, data.wait)
        notified(key)
      }
    }

  }
}, 10000)


// IPC Main Processes

ipcMain.on("checkBackendPing", async (event, details, state) => {
  event.returnValue = checkBackendUp();
})


ipcMain.on("logConsole", (event, data) => {
  log.info(`[RENDERER LOGS] ${data}`)
})

ipcMain.on("getConfig", (event) => {
  event.returnValue = require("./config.json")
})

ipcMain.on("getTourDate", async (event) => {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${appConfig.server_base_url}/api/v1/contents/EventDates.json`,
    headers: {
      "Content-Type": "application/json",
      "clientKey": clientKey
    },
  };
  
  try{
    let tourdate = await axios.request(config);

    event.returnValue = tourdate.data.data;
  }catch(e) {
  }
})

ipcMain.on("getAnnouncements", async (event) => {
  
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${appConfig.server_base_url}/api/v1/contents/announcements.json`,
    headers: {
      "Content-Type": "application/json",
      "clientKey": clientKey
    },
  };
  try{
    let tourdate = await axios.request(config);

    event.returnValue = tourdate.data.data;
  }catch(e) {
  }
})

ipcMain.on("getLive", async (event) => {
  
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${appConfig.server_base_url}/api/v1/contents/livestreams.json`,
    headers: {
      "Content-Type": "application/json",
      "clientKey": clientKey
    },
  };
  try{
    let tourdate = await axios.request(config);

    event.returnValue = tourdate.data.data;
  }catch(e) {
  }
})

ipcMain.on("notify", async (event, title, message, sound, wait) => {
  try{
    notify(title, message, sound, wait)
    event.returnValue = {
      success: true
    }
  }catch(e){
    event.returnValue = {
      success: false,
      message: e
    }
  }
})



// Auto Updater


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

// Notification Callback


notifier.on('click', function (notifierObject, options, event) {
  // Triggers if `wait: true` and user clicks notification
  createWindow()
});

notifier.on('timeout', function (notifierObject, options) {
  // Triggers if `wait: true` and notification closes
});



// All functions

/**
 * Return to the server to check that the app has notified the user
 * 
 * @param {String} clientKey the registered client key!
 * @returns {Object} object returned by the server
 */
async function notified(clientKey){
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://tsconnect.taylorcentral.live/api/v1/contents/notificationCallback',
    headers: { 
      'clientKey': clientKey
    }
  };
  
  return (await axios.request(config)).data
}

/**
 * Send a notification
 * 
 * @param {String} title the title of the notification
 * @param {String} message the message of the notification
 * @param {boolean} sound whether or not to play a sound | default: true
 * @param {boolean} wait whether or not to wait for callback | default: true
 */
function notify(title, message, sound=true, wait=true){

  notifier.notify(
    {
      title: title,
      message: message,
      sound: sound, // Only Notification Center or Windows Toasters
      wait: wait // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
    },
    function (err, response, metadata) {
      // Response is response from notification
      // Metadata contains activationType, activationAt, deliveredAt
      if(err == null){
        log.info(response, metadata)
      }else{
        log.error(err)
      }
    }
  );
}


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

async function checkRegistration(cKey){
  if(cKey == undefined) return false
  
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${appConfig.server_base_url}/api/v1/checkRegistration`,
    headers: {
      "Content-Type": "application/json",
      "clientKey": cKey
    },
  };
  let registration = (await axios.request(config)).data;
  if(registration.success == false){
    log.error("Error connecting to backend.")
    throwError("Error", "An error occured connecting to our backend server.")
    app.quit()
    return
  }
  return registration.data.ok
}

async function checkBackendUp(){
  
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${appConfig.server_base_url}/api/v1/ping`,
    headers: {
      "Content-Type": "application/json"
    },
  };

  try{
  let ping = (await axios.request(config)).data;
  if(ping.success == true){
    return true
  }else{
    log.error("[QUITTING] Backend server is down.")
    throwError("Connection Failed", "Failed to connect to our backend server. Please try relaunching the application.")
    app.quit()
    return false
  }
  }catch(e) {
    log.error("[QUITTING] Backend server is down.")
    throwError("Connection Failed", "Failed to connect to our backend server. Please try relaunching the application.")
    app.quit()
    return false
  }
  

}

function loadApp(){
  if (process.platform == 'darwin'){
    log.info(`[MACOS Only] Registering Menu Items and Shortcuts`)
    let menuItems = [
      {
        label: 'TSConnect', 
        submenu: [
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



function checkForFirstRun(){
  if(store.get("isFirstLaunch") == undefined || store.get("isFirstLaunch") == true)return true;
  return false;
}

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
  autoUpdater.checkForUpdatesAndNotify();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  
}

function throwError (title, error) {
  dialog.showErrorBox(title, error) 
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
  if(process.env.TSC_DEBUG == "true"){
    mainWindow.webContents.openDevTools()
  }
  // 
  
  mainWindow.on('close', (e) => {
    if (mainWindow.forceClose) return;
    e.preventDefault();
    mainWindow.hide();
  });
  readyForNotification = true;
  
}


/**
 * 
 * @param {String} clientKey Register a client key with the registry
 * @returns {Object} Object returned by the registry
 */
async function registerClientKey(clientKey) {
  if(!clientKey){
    throwError("First Launch Failed.", "Please try restarting application or contact support.")
    app.quit()
    return
  }
  let data = JSON.stringify({
    "clientKey": clientKey
  });

  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${appConfig.server_base_url}/api/v1/register`,
    headers: { 
      'Content-Type': 'application/json'
    },
    data : data
  };
  try{
    return (await axios.request(config)).data
  }catch(e) {
    return e
  }
  
  
}