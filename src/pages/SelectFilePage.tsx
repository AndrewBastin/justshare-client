import React, { ChangeEvent } from 'react';

interface Props {
  waitingForAccept: boolean;
  onFileSelect: (ev: ChangeEvent<HTMLInputElement>) => void
}

const SelectFilePage: React.FC<Props> = (props) => {
  if (!props.waitingForAccept) {
    return (
      <div>
        <div className="App-ListHeading">Select File</div>
        <input type="file" onChange={props.onFileSelect}></input>
      </div>
    );
  } else {
    return (
      <div>
        <div className="App-ListHeading">Select File</div>
        <div>Waiting for the reciever to accept...</div>
      </div>
    );
  }
}

export default SelectFilePage;
