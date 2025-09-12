// NotificationProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

type Notification = {
  id: number;
  message: string;
  type?: "success" | "error" | "info";
};

type NotificationContextType = {
  notify: (message: string, type?: Notification["type"]) => void;
  loading: boolean
  setLoading: (_loading: boolean) => void
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const [loading, setLoading] = useState(false)

  const notify = (message: string, type: Notification["type"] = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // auto remove sau 5s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ notify, loading, setLoading }}>
      {children}

      {/* Notification container */}
      <div className="fixed top-16 right-4 space-y-2 z-50 max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded-xl shadow-md bg-white border-l-4 animate-slide-in
              ${n.type === "success" ? "border-green-500 text-green-700" : ""}
              ${n.type === "error" ? "border-red-500 text-red-700" : ""}
              ${n.type === "info" ? "border-blue-500 text-blue-700" : ""}
            `}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
};
