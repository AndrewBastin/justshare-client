import React from "react";

import PeerInfo from '../api/PeerInfo';
import TransfersList from '../components/TransfersList/TransfersList';
import { AnimatePresence, motion } from 'framer-motion';
import TransferTarget from "../components/TransferTarget/TransferTarget";

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
          {
            (props.peers.length > 0) ? 
                props.peers.map((peer) => {
                    return (
                        <TransferTarget
                            key={peer.peerID}
                            peer={peer}
                            onPeerSelect={() => props.onPeerSelect(peer.peerID)}
                        />
                    );
                })
                :
                (
                    <div className="App-Message">
                        No one else is here. <br />
                        Open JustShare on the other device to begin sharing.
                    </div>
                )
         }
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ShareWithPage;
