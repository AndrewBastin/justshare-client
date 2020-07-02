import React from 'react';
import PeerInfo from '../api/PeerInfo';
import FileSendRequest from '../api/FileSendRequest';
import {fileSizeSI} from '../api/Size';

interface Props {
  peers: PeerInfo[];
  lockAccept: boolean;
  fileRequest: FileSendRequest;
  onReceiveDecision: (decision: boolean) => void;
}

const ReceiveFilePage: React.FC<Props> = (props) => {
  let senderInfo = props.peers.find(p => p.peerID === props.fileRequest.senderSocketID)

  return (
    <div>
      <div className="App-ListHeading">Recieve</div>
      <p>
        { senderInfo ? senderInfo.nickname : props.fileRequest.senderSocketID } wants to send 
        &nbsp;{props.fileRequest.filename} ({fileSizeSI(props.fileRequest.filesizeBytes)}) <br />
        <br />
        <br />
        Accept ?
        <br />
        <br />
        <button disabled={props.lockAccept} onClick={() => props.onReceiveDecision(true) }>Accept</button>
        <button disabled={props.lockAccept} onClick={() => props.onReceiveDecision(false) }>Deny</button>
      </p>
    </div>
  );
}

export default ReceiveFilePage;
