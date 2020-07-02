import React, {useState} from 'react';

interface Props {
  handleNicknameSelect: (nickname: string) => void;
}

const NicknamePage: React.FC<Props> = (props) => {
  // TODO : Nickname validation

  const [nickname, setNickname] = useState("");

  return (
    <div>
      <div className="App-ListHeading">Nickname</div>
      <div>Enter the nickname (you will be shown on other devices with this name) : </div>
      <input 
        value={ nickname ? nickname : "" } 
        onChange={(ev) => setNickname(ev.target.value)}
      />
      
      <button onClick={() => props.handleNicknameSelect(nickname)}>
        Done
      </button>
    </div>
  )
}

export default NicknamePage;
