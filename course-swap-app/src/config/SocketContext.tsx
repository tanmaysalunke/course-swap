import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { auth } from "../config/Firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface ContextType {
  socket: Socket | null;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  notifCount: number;
  setNotifCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<ContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [user] = useAuthState(auth);
  const userEmail = user?.email;

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected!");
      if (userEmail) {
        console.log("Requesting notifications for", userEmail);
        newSocket.emit("requestNotifications", userEmail);
      }
    });

    newSocket.on("updateNotifications", (newNotifications: Notification[]) => {
      // console.log("Received notifications:", newNotifications);
      setNotifications(newNotifications);
      setNotifCount(newNotifications.length);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection Error:", error);
    });

    return () => {
      newSocket.close();
    };
  }, [userEmail]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        setNotifications,
        notifCount,
        setNotifCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
