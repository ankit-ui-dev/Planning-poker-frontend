# Sprint Planning Room Tool

A real-time Sprint Planning application for agile teams to estimate tasks collaboratively.

## Features

- Create and join Sprint Planning
- Real-time card selection and submission
- Card reveal functionality
- Room reset for new rounds
- WebSocket-based real-time updates

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a PostgreSQL database named `planning_poker`

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database credentials in `.env`

5. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms` - Get all rooms

### Players
- `POST /api/rooms/:roomId/players` - Add a player to a room

### Cards
- `POST /api/rooms/:roomId/cards` - Submit a card
- `POST /api/rooms/:roomId/reveal` - Reveal all cards
- `POST /api/rooms/:roomId/reset` - Reset the room

## WebSocket Events

### Client to Server
- `join_room` - Join a specific room
- `disconnect` - Handle client disconnection

### Server to Client
- `player_joined` - New player joined the room
- `card_submitted` - A player submitted a card
- `cards_revealed` - All cards are revealed
- `room_reset` - Room has been reset

## Development

To start the development server:
```bash
npm run dev
```

To run tests:
```bash
npm test
``` 