const express = require('express');
const cors = require('cors');
const teamRoutes = require('./routes/team.routes');
const authRoutes = require('./routes/auth.routes');
const playerRoutes = require('./routes/player.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const registrationRoutes = require('./routes/registration.routes');
const matchRoutes = require('./routes/match.routes');

const app = express();

// Allow the deployed frontend plus local dev. CLIENT_URL is set in Render's
// environment; multiple origins can be comma-separated if needed later.
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((o) => o.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server).
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/matches', matchRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;