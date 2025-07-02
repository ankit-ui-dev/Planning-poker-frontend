const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { generateRoomCode } = require('./utils');
const { pool, testConnection } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Default sequence for rooms
const DEFAULT_SEQUENCE = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];

// Get active rooms with better error handling
app.get('/api/rooms/active', async (req, res) => {
  res.status(404).json({ error: 'This endpoint has been deprecated' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_room', async (roomId) => {
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Create a new room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description, playerName, sequence } = req.body;
    let roomCode;
    let isUnique = false;

    // Generate a unique room code
    while (!isUnique) {
      roomCode = generateRoomCode();
      const existingRoom = await pool.query(
        'SELECT id FROM rooms WHERE room_code = $1',
        [roomCode]
      );
      if (existingRoom.rows.length === 0) {
        isUnique = true;
      }
    }

    // Create room
    const roomResult = await pool.query(
      'INSERT INTO rooms (name, description, room_code, sequence) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, roomCode, sequence || DEFAULT_SEQUENCE]
    );

    const room = roomResult.rows[0];

    // Create first player (admin)
    const playerResult = await pool.query(
      'INSERT INTO players (room_id, name, is_admin) VALUES ($1, $2, true) RETURNING *',
      [room.id, playerName]
    );

    res.status(201).json({
      room,
      player: playerResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room by code
app.get('/api/rooms/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query('SELECT * FROM rooms WHERE room_code = $1', [code.toUpperCase()]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get room details including players
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Get room details
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get players in the room
    const playersResult = await pool.query(
      'SELECT * FROM players WHERE room_id = $1 ORDER BY joined_at ASC',
      [roomId]
    );

    // Add default sequence if not present
    const room = roomResult.rows[0];
    if (!room.sequence) {
      room.sequence = DEFAULT_SEQUENCE;
    }

    res.json({
      ...room,
      players: playersResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

// Add player to room
app.post('/api/rooms/:roomId/players', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, isAdmin } = req.body;

    // Validate name is provided
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    
    // Check if room exists
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if player name is already taken in this room
    const existingPlayer = await pool.query(
      'SELECT * FROM players WHERE room_id = $1 AND name = $2',
      [roomId, name]
    );
    if (existingPlayer.rows.length > 0) {
      return res.status(400).json({ error: 'Player name already taken in this room' });
    }

    // Get current players to determine if this is the first player
    const currentPlayers = await pool.query(
      'SELECT * FROM players WHERE room_id = $1',
      [roomId]
    );
    const isFirstPlayer = currentPlayers.rows.length === 0;
    
    const result = await pool.query(
      'INSERT INTO players (room_id, name, is_admin) VALUES ($1, $2, $3) RETURNING *',
      [roomId, name.trim(), isAdmin || isFirstPlayer]
    );

    io.to(roomId).emit('player_joined', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add player to room' });
  }
});

// Submit card
app.post('/api/rooms/:roomId/cards', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId, value } = req.body;

    const result = await pool.query(
      'INSERT INTO cards (room_id, player_id, value) VALUES ($1, $2, $3) ON CONFLICT (room_id, player_id) DO UPDATE SET value = EXCLUDED.value RETURNING *',
      [roomId, playerId, value]
    );

    io.to(roomId).emit('card_submitted', result.rows[0]);

    // Check if all players have submitted cards
    const [players, cards] = await Promise.all([
      pool.query('SELECT id FROM players WHERE room_id = $1', [roomId]),
      pool.query('SELECT DISTINCT player_id FROM cards WHERE room_id = $1', [roomId])
    ]);

    if (players.rows.length === cards.rows.length) {
      io.to(roomId).emit('all_cards_submitted');
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit card' });
  }
});

// Reveal cards
app.post('/api/rooms/:roomId/reveal', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await pool.query(
      'UPDATE cards SET is_revealed = true WHERE room_id = $1 RETURNING *',
      [roomId]
    );

    io.to(roomId).emit('cards_revealed', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reveal cards' });
  }
});

// Reset room (clear cards)
app.post('/api/rooms/:roomId/reset', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    await pool.query('DELETE FROM cards WHERE room_id = $1', [roomId]);

    io.to(roomId).emit('room_reset');
    res.json({ message: 'Room reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset room' });
  }
});

// Delete room
app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    // Verify the player is an admin
    const playerResult = await pool.query(
      'SELECT is_admin FROM players WHERE room_id = $1 AND id = $2',
      [roomId, playerId]
    );

    if (playerResult.rows.length === 0 || !playerResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Only admin can delete the room' });
    }

    // Delete the room (cascade will handle related records)
    await pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);

    io.to(roomId).emit('room_deleted');
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get room cards
app.get('/api/rooms/:roomId/cards', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM cards WHERE room_id = $1',
      [roomId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

const PORT = process.env.PORT || 3001;

// Start server with database connection check
const startServer = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Could not establish database connection. Exiting...');
      process.exit(1);
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 