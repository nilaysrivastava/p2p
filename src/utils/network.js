import dgram from 'dgram';
import { NETWORK } from '../config/constants.js';

export function createMulticastSocket() {
  const socket = dgram.createSocket('udp4');
  
  socket.bind(() => {
    socket.setBroadcast(true);
    socket.setMulticastTTL(128);
  });

  return socket;
}

export function broadcastMessage(socket, message) {
  const data = JSON.stringify(message);
  socket.send(
    data,
    0,
    data.length,
    NETWORK.MULTICAST_PORT,
    NETWORK.MULTICAST_ADDR
  );
}