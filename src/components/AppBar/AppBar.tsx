import React from 'react';

import { Delete } from '@material-ui/icons';

import "./AppBar.css";

interface Props {
  nickname: string | null;
  socketID: string | null;
  onDeleteNickname: () => void;
}

const AppBar: React.FC<Props> = (props) => {
  if (props.socketID) {
    return (
      <div className="AppBar">
        <div className="AppBar-titles">
          <div className="AppBar-nickname">{props.nickname}</div>
          <div className="AppBar-id">{props.socketID}</div>
        </div>
        <div className="AppBar-icons">
          <button className="AppBar-icon" onClick={props.onDeleteNickname}>
            <Delete />
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div>
      </div>
    );
  }
}

export default AppBar
