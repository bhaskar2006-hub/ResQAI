let ioInstance = null;

export const setIoInstance = (io) => {
  ioInstance = io;
  console.log('Socket.IO instance registered in socket.service');
};

export const getIoInstance = () => {
  return ioInstance;
};

export const broadcastEvent = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
    console.log(`[Socket Broadcast] Event: ${event}`);
  } else {
    console.log(`[Socket Broadcast Offline] Event: ${event} (data payload truncated/logged in dev)`);
  }
};
