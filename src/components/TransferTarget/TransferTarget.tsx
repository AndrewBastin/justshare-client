import React from 'react';

import PeerInfo from '../../api/PeerInfo';
import { motion } from 'framer-motion';

import './TransferTarget.css';

interface Props {
  peer: PeerInfo;
  onPeerSelect: () => void;
}

const TransferTarget: React.FC<Props> = (props) => {
  return (
    <motion.a
      initial={{
        opacity: 0,
        scale: 0,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0,
      }}
      className="TransferTarget-ListItem"
      onClick={props.onPeerSelect}
    >
      {props.peer.nickname ? props.peer.nickname : props.peer.peerID}
    </motion.a>
  );
}

export default TransferTarget;
