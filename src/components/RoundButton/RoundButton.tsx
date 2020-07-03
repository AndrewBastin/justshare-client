import React from 'react';

interface Props {
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

const RoundButton: React.FC<Props> = (props) => {
  return (
    <button
      style={{
        backgroundColor: props.color,
        border: 0,
        padding: 20,
        paddingLeft: 22,
        paddingRight: 22,
        margin: 5,
        color: 'white',
        borderRadius: 1000,
          opacity: props.disabled ? 0.2 : 1 
      }}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export default RoundButton;
