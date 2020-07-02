import React from 'react';

const UnsupportedPage: React.FC<{}> = () => {
  return (
    <div>
      <div className="App-ListHeading">Unsupported</div>
      <div>
        Your browser does not seem to support the technologies required for this
        program to work, please upgrade to a modern browser with WebRTC support.
      </div>
    </div>
  )
}

export default UnsupportedPage;
