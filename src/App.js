import { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import {
  faPlus,
  faFileImport,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr } from './utils/helper';

import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import defaultFiles from './utils/defaultFiles';
import useIpcRenderer from './hooks/useIpcRenderer';

import fileHelper from './utils/fileHelper';

const { join, basename, extname, dirname } = window.require('path');
const remote = window.require('@electron/remote');
const Store = window.require('electron-store');
const { ipcRenderer } = window.require('electron');

const settingsStore = new Store({ name: 'Settings' });

const fileStore = new Store({ name: 'File Data' });
const saveFilesToStore = (files) => {
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt } = file;
    result[id] = {
      id,
      path,
      title,
      createdAt,
    };
    return result;
  }, {});
  fileStore.set('files', filesStoreObj);
};

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {});
  const filesArr = objToArr(files);
  const [activeFileID, setActiveFileID] = useState('');
  const [openedFileIDs, setOpenedFileIDs] = useState([]);
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([]);
  const [searchedFiles, setSearchedFiles] = useState([]);
  const savedLocation =
    settingsStore.get('savedFileLocation') || remote.app.getPath('documents');
  const activeFile = files[activeFileID];
  const openedFiles = openedFileIDs.map((openID) => {
    return files[openID];
  });
  const fileListArr = searchedFiles.length > 0 ? searchedFiles : filesArr;

  const fileClick = (fileID) => {
    setActiveFileID(fileID);
    const currentFile = files[fileID];
    if (!currentFile.isLoaded) {
      fileHelper.readFile(currentFile.path).then((value) => {
        const newFile = { ...files[fileID], body: value, isLoaded: true };
        setFiles({ ...files, [fileID]: newFile });
      });
    }
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID]);
    }
    console.log(openedFiles, openedFileIDs);
  };
  const tabClick = (fileID) => {
    setActiveFileID(fileID);
  };
  const tabClose = (id) => {
    const tabsWithout = openedFileIDs.filter((fileID) => fileID !== id);
    setOpenedFileIDs(tabsWithout);
    if (tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0]);
    } else {
      setActiveFileID([]);
    }
  };
  const fileChange = (id, value) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value };
      setFiles({ ...files, [id]: newFile });
      if (!unsavedFileIDs.includes(id)) {
        setUnsavedFileIDs([...unsavedFileIDs, id]);
      }
    }
  };
  const deleteFile = (id) => {
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files;
      setFiles(afterDelete);
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files;
        setFiles(afterDelete);
        saveFilesToStore(afterDelete);
        tabClose(id);
      });
    }
  };
  const updateFileName = (id, title, isNew) => {
    const newPath = isNew
      ? join(savedLocation, `${title}.md`)
      : join(dirname(files[id].path, `${title}.md`));

    const modifiedFile = { ...files[id], title, isNew: false, path: newPath };
    const newFiles = { ...files, [id]: modifiedFile };
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      });
    } else {
      const oldPath = files[id].path;
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      });
    }
  };
  const fileSearch = (keyword) => {
    const newFiles = filesArr.filter((file) => file.title.includes(keyword));
    setSearchedFiles(newFiles);
  };
  const createNewFile = () => {
    const newID = uuidv4();
    const newFile = {
      id: newID,
      title: '',
      body: '## ?????????Markdown',
      createdAt: new Date().getTime(),
      isNew: true,
    };
    setFiles({ ...files, [newID]: newFile });
  };
  const saveCurrentFile = () => {
    fileHelper.writeFile(activeFile.path, activeFile.body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter((id) => id !== activeFile.id));
    });
  };
  const importFiles = () => {
    remote.dialog.showOpenDialog(
      {
        title: '???????????????Markdowm ??????',
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: 'Markdown files',
            extensions: ['md'],
          },
        ],
      },
      (paths) => {
        if (Array.isArray(paths)) {
          const filteredPaths = paths.filter((path) => {
            const alreadyAdded = Object.values(files).find((file) => {
              return file.path === path;
            });
            return !alreadyAdded;
          });
          const importFilesArr = filteredPaths.map((path) => {
            return {
              id: uuidv4,
              title: basename(path, extname(path)),
              path,
            };
          });
          const newFiles = { ...files, ...flattenArr(importFiles) };
          setFiles(newFiles);
          saveFilesToStore(newFiles);
          if (importFilesArr.length > 0) {
            remote.dialog.showMessageBox({
              type: 'info',
              title: `???????????????${importFilesArr.length}?????????`,
              message: `???????????????${importFilesArr.length}?????????`,
            });
          }
        }
      }
    );
  };
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'search-file': fileSearch,
  });
  return (
    <div className="App container-fluid">
      <div className="row no-gutters">
        <div className="col-3 bg-light left-panel">
          <FileSearch onFileSearch={fileSearch} />
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn
                text="??????"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col">
              <BottomBtn
                text="??????"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {!activeFile && (
            <div className="start-page">????????????????????????Markdown??????</div>
          )}
          {activeFile && (
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unSaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                key={activeFileID}
                value={activeFile && activeFile.body}
                onChange={(value) => {
                  console.log(value);
                  fileChange(activeFile.id, value);
                }}
                options={{ minHeight: '515px' }}
              />
              {/* <BottomBtn
                text="??????"
                onBtnClick={saveCurrentFile}
                colorClass="btn-success"
                icon={faSave}
              /> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
