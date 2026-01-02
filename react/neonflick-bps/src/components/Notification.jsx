import { useEffect, useState } from "react";

export default function Notification({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // 🔹 Показуємо сповіщення при зміні message
  useEffect(() => {
    if (!message) return;

    setVisible(true); // показати

    const timer = setTimeout(() => {
      handleClose(); // через 7 секунд закриваємо так само, як на кнопку close
    }, 7000);

    return () => clearTimeout(timer); // очищаємо таймер при unmount / новому message
  }, [message]);

  if (!visible || !message) return null;

  // 🔹 Визначаємо текст для відображення
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
