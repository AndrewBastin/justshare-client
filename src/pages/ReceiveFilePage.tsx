import React from 'react';
import PeerInfo from '../api/PeerInfo';
import FileSendRequest from '../api/FileSendRequest';
import {fileSizeSI} from '../api/Size';
import RoundButton from '../components/RoundButton/RoundButton';

import { Done, Close } from '@material-ui/icons';
import {motion} from 'framer-motion';

interface Props {
  peers: PeerInfo[];
  lockAccept: boolean;
  fileRequest: FileSendRequest;
  onReceiveDecision: (decision: boolean) => void;
}

const ReceiveFilePage: React.FC<Props> = (props) => {
  let senderInfo = props.peers.find(p => p.peerID === props.fileRequest.senderSocketID)

  return (
    <motion.div
      initial={{ opacity: 0, x: 200 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -200 }}
    >
      <div className="App-ListHeading">Recieve</div>
      <p>
        { senderInfo ? senderInfo.nickname : props.fileRequest.senderSocketID } wants to send 
        &nbsp;{props.fileRequest.filename} ({fileSizeSI(props.fileRequest.filesizeBytes)}) <br />
        <br />
        <br />
        Accept ?
        <br />
        <br />
        <div
          style={{
            paddingLeft: '10%',
            paddingRight: '10%'
          }}
        >
          <div 
            style={{
              float: 'left',
              clear: 'none'
            }}
          >
            <RoundButton color={"green"} disabled={props.lockAccept} onClick={() => props.onReceiveDecision(true)}>
              <Done />
            </RoundButton>
          </div>
          <div
            style={{
              float: 'right',
              clear: 'none'
            }}
          >
            <RoundButton color={"red"} disabled={props.lockAccept} onClick={() => props.onReceiveDecision(false)}>
              <Close />
            </RoundButton>
          </div>
        </div>
      </p>
    </motion.div>
  );
}

export default ReceiveFilePage;
