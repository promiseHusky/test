const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const menuTemplate = require('./src/menuTemplate');
const AppWindow = require('./src/AppWindow');
const { autoUpdater } = require('electron-updater');

let mainWindow, settingsWindow;

app.on('ready', () => {
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error == null ? 'unknow' : error.static);
  });
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(
      {
        type: 'info',
        title: '应用有新的版本',
        message: '发现新的版本是否现在更新？',
        buttons: ['是', '否'],
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          autoUpdater.downloadUpdate();
        }
      }
    );
  });
  autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
      title: '没有新版本',
      message: '当前已是最新版本',
    });
  });
  const mainWindowConfig = {
    width: 1440,
    height: 768,
  };
  const urlLocation = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, './index.html')}`;
  mainWindow = new AppWindow(mainWindowConfig, urlLocation);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  require('@electron/remote/main').initialize(); //添加语句
  require('@electron/remote/main').enable(mainWindow.webContents); //添加语句
  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow,
    };
    const settingsFileLocation = `file://${path.join(
      __dirname,
      './settings/settings.html'
    )}`;
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
    require('@electron/remote/main').enable(settingsWindow.webContents);
  });
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
});
