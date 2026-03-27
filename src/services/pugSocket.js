import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiBase';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(getApiBaseUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function joinLobbyRoom(lobbyId) {
  const s = getSocket();
  if (s.connected) s.emit('join:lobby', lobbyId);
}

export function leaveLobbyRoom(lobbyId) {
  const s = getSocket();
  if (s.connected) s.emit('leave:lobby', lobbyId);
}
