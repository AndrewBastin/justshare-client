import React, { ChangeEvent } from 'react';
import {motion} from 'framer-motion';

interface Props {
  waitingForAccept: boolean;
  onFileSelect: (ev: ChangeEvent<HTMLInputElement>) => void
}

const SelectFilePage: React.FC<Props> = (props) => {
  if (!props.waitingForAccept) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 200 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -200 }}
      >
        <div className="App-ListHeading">Select File</div>
        <input type="file" onChange={props.onFileSelect}></input>
      </motion.div>
    );
  } else {
    return (
      <motion.div animate>
        <div className="App-ListHeading">Select File</div>
        <div>Waiting for the reciever to accept...</div>
      </motion.div>
    );
  }
}

export default SelectFilePage;
