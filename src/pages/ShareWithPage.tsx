import React from "react";

import PeerInfo from '../api/PeerInfo';
import TransfersList from '../components/TransfersList/TransfersList';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  peers: PeerInfo[]
  onPeerSelect: (peerID: string) => void
}

const ShareWithPage: React.FC<Props> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 200 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -200 }}
    >
      <TransfersList />
      <div className="App-ListHeading">Share With</div>
      <div>
        <AnimatePresence>
          {props.peers.map((peer) => {
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
                className="App-ListItem"
                key={peer.peerID}
                onClick={() => props.onPeerSelect(peer.peerID)}
              >
                {peer.nickname ? peer.nickname : peer.peerID}
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ShareWithPage;
