import React, { useEffect } from 'react';

const Toast = ({ show, message, onClose }) => {
  useEffect(() => {
    if (!show) return undefined;
    const timer = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timer);
  }, [show, message, onClose]);

  if (!show) return null;
  return <div className="toast" role="status">{message}</div>;
};

export default Toast;
