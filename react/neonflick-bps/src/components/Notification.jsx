import { useEffect, useState } from "react";

export default function Notification({ message, onClose }) {
  const [visible, setVisible] = useState(true);

  // 🔹 Визначаємо текст для відображення
  // Якщо message — об’єкт з полем message, беремо його
  // Інакше просто рядок або серіалізуємо об’єкт у JSON
  const displayMessage =
    typeof message === "object" && message !== null
      ? message.message || JSON.stringify(message)
      : message;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 7000); // ⏱ 7 секунд

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible || !displayMessage) return null;

  return (
    <div className="notification">
      <span>{displayMessage}</span>
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
