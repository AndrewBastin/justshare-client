import React, {useState} from 'react';
import {motion} from 'framer-motion';

import './NicknamePage.css';

interface Props {
  handleNicknameSelect: (nickname: string) => void;
}

const NicknamePage: React.FC<Props> = (props) => {
  // TODO : Nickname validation

  const [nickname, setNickname] = useState("");

  return (
    <motion.div
      className="NicknamePage-main"
      initial={{ opacity: 0, x: 200 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -200 }}
    >
      <div className="App-ListHeading">Nickname</div>
      <div className="NicknamePage-caption">Enter the nickname (you will be shown on other devices with this name) </div>
      <input 
        className="NicknamePage-entry"
        value={ nickname ? nickname : "" } 
        onChange={(ev) => setNickname(ev.target.value)}
      />
      
      <button className="NicknamePage-done" onClick={() => props.handleNicknameSelect(nickname)}>
        Done
      </button>
    </motion.div>
  )
}

export default NicknamePage;
