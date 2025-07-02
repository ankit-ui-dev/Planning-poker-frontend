const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { pool, setupDatabase } = require('./db/setup');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize database
setupDatabase().catch(console.error);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_room', async (roomId) => {
    // Only join the socket to the room, don't create a player record
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Add this function at the top of the file after the imports
function generateRoomCode() {
  // Generate a random 6-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Default sequence
const DEFAULT_SEQUENCE = ['0', '1', '2', '3', '5', '8', '13', '?'];

// API Routes
// Create a new room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description, playerName, sequence } = req.body;
    
    // Generate a unique room code
    let roomCode;
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = generateRoomCode();
      // Check if code already exists
      const existingRoom = await pool.query(
        'SELECT id FROM rooms WHERE room_code = $1',
        [roomCode]
      );
      if (existingRoom.rows.length === 0) {
        isUnique = true;
      }
    }
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create the room (without sequence for now)
      const roomResult = await client.query(
        'INSERT INTO rooms (name, description, room_code) VALUES ($1, $2, $3) RETURNING *',
        [name, description, roomCode]
      );
      const roomId = roomResult.rows[0].id;

      // Add the first player as admin
      const playerResult = await client.query(
        'INSERT INTO players (room_id, name, is_admin) VALUES ($1, $2, $3) RETURNING *',
        [roomId, playerName, true]
      );

      await client.query('COMMIT');

      // Return response with default sequence
      res.status(201).json({
        room: {
          ...roomResult.rows[0],
          sequence: sequence || DEFAULT_SEQUENCE
        },
        player: playerResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Delete a room
app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    // Check if the player is an admin of this room
    const playerResult = await pool.query(
      'SELECT * FROM players WHERE id = $1 AND room_id = $2 AND is_admin = true',
      [playerId, roomId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(403).json({ error: 'Only room admin can delete the room' });
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete all cards in the room
      await client.query('DELETE FROM cards WHERE room_id = $1', [roomId]);
      
      // Delete all players in the room
      await client.query('DELETE FROM players WHERE room_id = $1', [roomId]);
      
      // Delete the room
      await client.query('DELETE FROM rooms WHERE id = $1', [roomId]);

      await client.query('COMMIT');

      io.to(roomId).emit('room_deleted');
      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get room by code
app.get('/api/rooms/code/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM rooms WHERE room_code = $1',
      [roomCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
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

// Get cards for a room
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
    
    // Check if player already submitted a card
    const existingCard = await pool.query(
      'SELECT * FROM cards WHERE room_id = $1 AND player_id = $2',
      [roomId, playerId]
    );

    let result;
    if (existingCard.rows.length > 0) {
      // Update existing card
      result = await pool.query(
        'UPDATE cards SET value = $1 WHERE room_id = $2 AND player_id = $3 RETURNING *',
        [value, roomId, playerId]
      );
    } else {
      // Create new card
      result = await pool.query(
        'INSERT INTO cards (room_id, player_id, value) VALUES ($1, $2, $3) RETURNING *',
        [roomId, playerId, value]
      );
    }

    // Get all cards for the room to check if all players have submitted
    const allCards = await pool.query(
      'SELECT * FROM cards WHERE room_id = $1',
      [roomId]
    );

    // Get all players in the room
    const allPlayers = await pool.query(
      'SELECT * FROM players WHERE room_id = $1',
      [roomId]
    );

    // Check if all players have submitted
    const allPlayersSubmitted = allPlayers.rows.every(player => 
      allCards.rows.some(card => card.player_id === player.id)
    );

    // Emit card submission event with the updated card
    io.to(roomId).emit('card_submitted', result.rows[0]);

    // If all players have submitted, emit an event
    if (allPlayersSubmitted) {
      console.log('All players have submitted their cards');
      io.to(roomId).emit('all_cards_submitted');
    }

    res.status(201).json({
      ...result.rows[0],
      allPlayersSubmitted
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit card' });
  }
});

// Reveal cards
app.post('/api/rooms/:roomId/reveal', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    await pool.query(
      'UPDATE cards SET is_revealed = true WHERE room_id = $1',
      [roomId]
    );

    const revealedCards = await pool.query(
      'SELECT * FROM cards WHERE room_id = $1',
      [roomId]
    );

    io.to(roomId).emit('cards_revealed', revealedCards.rows);
    res.json({ message: 'Cards revealed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reveal cards' });
  }
});

// Reset room
app.post('/api/rooms/:roomId/reset', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    await pool.query(
      'DELETE FROM cards WHERE room_id = $1',
      [roomId]
    );

    io.to(roomId).emit('room_reset');
    res.json({ message: 'Room reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset room' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 