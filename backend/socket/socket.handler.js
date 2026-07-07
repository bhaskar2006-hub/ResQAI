import * as agentService from '../services/agent.service.js';

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room or channel (e.g. for specific roles or locations)
    socket.on('join', (room) => {
      socket.join(room);
      console.log(`Socket client ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`Socket client ${socket.id} left room: ${room}`);
    });

    // Register agent
    socket.on('agent:register', async (data, callback) => {
      try {
        const agent = await agentService.registerOrUpdateAgent(data);
        socket.join('agents'); // add to agents room
        socket.agentId = agent.id;
        socket.agentName = agent.name;
        console.log(`AI Agent registered via Socket: ${agent.name} (ID: ${agent.id})`);
        if (callback) typeof callback === 'function' && callback({ success: true, agent });
      } catch (err) {
        console.error('Socket agent:register error:', err.message);
        if (callback) typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    // Propose action
    socket.on('agent:propose_action', async (data, callback) => {
      try {
        const agentId = socket.agentId || data.agentId;
        if (!agentId) {
          throw new Error('Agent not registered. Send agent:register first or supply agentId.');
        }
        const action = await agentService.proposeAction(agentId, data);
        console.log(`AI Agent ${socket.agentName || agentId} proposed action: ${action.actionType}`);
        if (callback) typeof callback === 'function' && callback({ success: true, action });
      } catch (err) {
        console.error('Socket agent:propose_action error:', err.message);
        if (callback) typeof callback === 'function' && callback({ success: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};
