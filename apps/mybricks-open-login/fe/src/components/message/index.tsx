import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import css from './index.less';

interface MessageProps {
  content: string;
  duration?: number;
  onClose?: () => void;
}

const Message: React.FC<MessageProps> = ({ content, duration = 3, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return <div className={css.message}>{content}</div>;
};

const messageContainer = document.createElement('div');
document.body.appendChild(messageContainer);

const showMessage = (content: string, duration?: number) => {
  const div = document.createElement('div');
  messageContainer.appendChild(div);

  const close = () => {
    ReactDOM.unmountComponentAtNode(div);
    messageContainer.removeChild(div);
  };

  ReactDOM.render(<Message content={content} duration={duration} onClose={close} />, div);
};

export default {
  success: (content: string, duration?: number) => showMessage(content, duration),
};