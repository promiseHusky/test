const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const menuTemplate = require('./src/menuTemplate');
const AppWindow = require('./src/AppWindow');

let mainWindow, settingsWindow;

app.on('ready', () => {
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
