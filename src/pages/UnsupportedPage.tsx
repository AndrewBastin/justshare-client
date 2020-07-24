import React from 'react';
import {motion} from 'framer-motion';

const UnsupportedPage: React.FC<{}> = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 200 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -200 }}
    >
      <div className="App-ListHeading">Unsupported</div>
      <div className="App-Message">
        Your browser does not seem to support the technologies required for this
        program to work, please upgrade to a modern browser with WebRTC support.
      </div>
    </motion.div>
  )
}

export default UnsupportedPage;
