import React, { createContext, useState, useEffect } from "react";
import io from "socket.io-client";

export const SocketContext = createContext();

const SOCKET_URL = "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemState, setSystemState] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on("connect", () => {
      console.log("Connected to backend");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setIsConnected(false);
    });

    newSocket.on("state_update", (data) => {
      setSystemState(data);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const startSimulation = () => {
    if (socket) socket.emit("start_simulation");
  };

  const stopSimulation = () => {
    if (socket) socket.emit("stop_simulation");
  };

  const resetSimulation = () => {
    if (socket) socket.emit("reset_simulation");
  };

  const fireWeapon = () => {
    if (socket) socket.emit("fire_weapon");
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        systemState,
        startSimulation,
        stopSimulation,
        resetSimulation,
        fireWeapon,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
