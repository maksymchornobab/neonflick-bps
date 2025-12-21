import { useEffect, useState } from "react";

export default function Notification({ message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 7000); // 7 секунд

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible || !message) return null;

  return (
    <div className="notification">
      <span>{message}</span>
      <button
        className="close-btn"
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
      >
        close
      </button>
    </div>
  );
}
