import { io } from "socket.io-client";

let socketInstance = null;

const createSocket = () => {
  const token = localStorage.getItem("whiteboard_user_token");


  socketInstance = io("https://real-time-collaborative-whiteboard-0vbu.onrender.com", {
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    autoConnect: !!token,
    transports: ["websocket"],
    auth: token ? { token } : {},
  });

  // Add connection event listeners for debugging
  socketInstance.on('connect', () => {
  
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socketInstance.on('disconnect', (reason) => {
  
  });

  return socketInstance;
};

export const getSocket = () => {
  if (socketInstance) return socketInstance;
  return createSocket();
};

export const reconnectWithToken = () => {
  if (socketInstance) {
    try { socketInstance.disconnect(); } catch (_) { }
    socketInstance = null;
  }
  return createSocket();
};

export default getSocket();