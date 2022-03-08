import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import PropTypes from 'prop-types';
import useKeyPress from '../hooks/useKeyPress';
import useContextMenu from '../hooks/useContextMenu';
import { getParentNode } from '../utils/helper';

const remote = window.require('@electron/remote');
const { Menu, MenuItem } = remote;

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [editStatus, setEditStatus] = useState(false);
  const [value, setValue] = useState(null);
  const enterPressed = useKeyPress(13);
  const escPressed = useKeyPress(27);
  const closeSearch = (editItem) => {
    setEditStatus(false);
    setValue('');
    if (editItem.isNew) {
      onFileDelete(editItem.id);
    }
  };
  const clickedItem = useContextMenu(
    [
      {
        label: '打开',
        click: () => {
          const parentElement = getParentNode(clickedItem.current, 'file-item');
          if (parentElement) {
            onFileClick(parentElement.dataset.id);
          }
        },
      },
      {
        label: '重命名',
        click: () => {
          console.log('deleting');
        },
      },
      {
        label: '删除',
        click: () => {
          console.log('clicking');
        },
      },
    ],
    '.file-list',
    [files]
  );
  // useEffect(() => {
  //   const menu = new Menu();
  //   menu.append(
  //     new MenuItem({
  //       label: '打开',
  //       click: () => {
  //         console.log('renaming');
  //       },
  //     })
  //   );
  //   menu.append(
  //     new MenuItem({
  //       label: '重命名',
  //       click: () => {
  //         console.log('deleting');
  //       },
  //     })
  //   );
  //   menu.append(
  //     new MenuItem({
  //       label: '删除',
  //       click: () => {
  //         console.log('clicking');
  //       },
  //     })
  //   );
  //   const handleContextMenu = (e) => {
  //     menu.popup({ window: remote.getCurrentWindow() });
  //   };
  //   window.addEventListener('contextmenu', handleContextMenu);
  //   return () => {
  //     window.removeEventListener('contextmenu', handleContextMenu);
  //   };
  // });
  useEffect(() => {
    const newFile = files.find((file) => file.isNew);
    if (newFile) {
      setEditStatus(newFile.id);
      setValue(newFile.title);
    }
  }, [files]);
  useEffect(() => {
    const editItem = files.find((file) => file.id === editStatus);
    if (enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value, editItem.isNew);
      setEditStatus(false);
      setValue('');
    }
    if (escPressed && editStatus) {
      closeSearch(editItem);
    }
    // const handleInputEvent = (event) => {
    //   const { keyCode } = event;
    //   if (keyCode === 13 && editStatus) {
    //     const editItem = files.find((file) => file.id === editStatus);
    //     onSaveEdit(editItem.id, value);
    //     setEditStatus(false);
    //     setValue('');
    //   } else if (keyCode === 27 && editStatus) {
    //     closeSearch(event);
    //   }
    // };
    // document.addEventListener('keyup', handleInputEvent);
    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent);
    // };
  });
  return (
    <ul className="list-group list-group-flush">
      {files.map((file) => (
        <li
          className="list-group-item row bg-light d-flex align-items-center file-item mx-0"
          key={file.id}
          data-id={file.id}
          data-title={file.title}
        >
          {file.id !== editStatus && !file.isNew && (
            <>
              <span className="col-2">
                <FontAwesomeIcon title="搜索" size="lg" icon={faMarkdown} />
              </span>
              <span
                className="col-6 c-link"
                onClick={() => {
                  onFileClick(file.id);
                }}
              >
                {file.title}
              </span>
              <button
                onClick={() => {
                  setEditStatus(file.id);
                  setValue(file.title);
                }}
                type="button"
                className="icon-button col-2"
              >
                <FontAwesomeIcon title="编辑" size="lg" icon={faEdit} />
              </button>
              <button
                onClick={() => {
                  onFileDelete(file.id);
                }}
                type="button"
                className="icon-button col-2"
              >
                <FontAwesomeIcon title="删除" size="lg" icon={faTrash} />
              </button>
            </>
          )}
          {(file.id === editStatus || file.isNew) && (
            <>
              <input
                className="form-control col-10"
                value={value}
                placeholder="请输入文件名称"
                onChange={(e) => {
                  setValue(e.target.value);
                }}
              />
              <button
                onClick={() => {
                  closeSearch(file);
                }}
                type="button"
                className="icon-button col-2"
              >
                <FontAwesomeIcon title="关闭" size="lg" icon={faTimes} />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

FileList.propTypes = {
  file: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func,
};

export default FileList;
