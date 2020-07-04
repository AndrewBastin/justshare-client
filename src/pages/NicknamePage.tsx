import React, {useState} from 'react';
import {motion} from 'framer-motion';

interface Props {
  handleNicknameSelect: (nickname: string) => void;
}

const NicknamePage: React.FC<Props> = (props) => {
  // TODO : Nickname validation

  const [nickname, setNickname] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, x: 200 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -200 }}
    >
      <div className="App-ListHeading">Nickname</div>
      <div>Enter the nickname (you will be shown on other devices with this name) : </div>
      <input 
        value={ nickname ? nickname : "" } 
        onChange={(ev) => setNickname(ev.target.value)}
      />
      
      <button onClick={() => props.handleNicknameSelect(nickname)}>
        Done
      </button>
    </motion.div>
  )
}

export default NicknamePage;
