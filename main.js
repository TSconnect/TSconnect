// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, globalShortcut } = require('electron')
const { autoUpdater } = require('electron-updater');
const path = require('node:path')
const url = require('url');


let mainWindow;


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'TSConnect',
    width: 950,
    height: 700,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })


  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname : path.join(__dirname,'public/test.html'),
    protocol:'file',
    slashes:true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  let menuItems = [
    {
      label: 'TSConnect', 
      submenu: [
        {label: 'Settings', click: console.log('file-new')},
        {type: 'separator'},
        {accelerator: "Cmd+qOrControl+q", label: 'Quit', click: function() {app.quit();}}
      ]
    },{
      label: 'App Control', 
      submenu: [
        {accelerator:"Cmd+hOrControl+h", label: 'Home', click: function () { 
          console.log()
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

  createWindow()

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

autoUpdater.on('update-available', () => {
  console.log("update available")
});

autoUpdater.on('update-downloaded', () => {
  console.log("installing now")
  autoUpdater.autoInstallOnAppQuit()
});

/**
 * Manager menu actions
 *
 * @param {String} type "Home", "Quizzes", "Tour", "Merch Alert", "Spotify"
 */
function menuManager(type) {
  if(mainWindow == undefined)return;
  type = type.toLowerCase()
  if(type == "home"){
    console.log("hi")
    mainWindow.loadURL(url.format({
      pathname : path.join(__dirname,'public/index.html'),
      protocol:'file',
      slashes:true
    }))
  }
}
