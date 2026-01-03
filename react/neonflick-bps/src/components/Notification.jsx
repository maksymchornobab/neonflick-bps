import { useEffect, useState } from "react";

export default function Notification({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };


  useEffect(() => {
    if (!message) return;

    setVisible(true);

    const timer = setTimeout(() => {
      handleClose();
    }, 7000);

    return () => clearTimeout(timer);
  }, [message]);

  if (!visible || !message) return null;

  const displayMessage =
    typeof message === "object" && message !== null
      ? message.message || JSON.stringify(message)
      : message;

  return (
    <div className="notification">
      <span>{displayMessage}</span>
      <button className="close-btn" onClick={handleClose}>
        close
      </button>
    </div>
  );
}
