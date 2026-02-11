/**
 * Main Routes Index
 * Menggabungkan semua routes
 */

const express = require('express');
const router = express.Router();

const countryRoutes = require('./countryRoutes');
const competitionRoutes = require('./competitionRoutes');
const matchRoutes = require('./matchRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Football Ranking API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Football Ranking System API',
    version: '1.0.0',
    endpoints: {
      countries: '/api/countries',
      competitions: '/api/competitions',
      matches: '/api/matches',
      health: '/api/health'
    },
    documentation: {
      countries: {
        'GET /api/countries': 'Get all countries',
        'GET /api/countries/:id': 'Get country by ID',
        'GET /api/countries/rankings/world': 'Get world rankings',
        'GET /api/countries/rankings/confederation/:confederation': 'Get confederation rankings',
        'GET /api/countries/compare/:id1/:id2': 'Compare two countries',
        'POST /api/countries': 'Create new country',
        'PUT /api/countries/:id': 'Update country',
        'DELETE /api/countries/:id': 'Delete country'
      },
      competitions: {
        'GET /api/competitions': 'Get all competitions',
        'GET /api/competitions/:id': 'Get competition by ID',
        'GET /api/competitions/:id/standings': 'Get competition standings',
        'GET /api/competitions/:id/statistics': 'Get competition statistics',
        'POST /api/competitions': 'Create new competition',
        'POST /api/competitions/:id/participants': 'Add participants',
        'PUT /api/competitions/:id': 'Update competition',
        'DELETE /api/competitions/:id': 'Delete competition'
      },
      matches: {
        'GET /api/matches': 'Get all matches',
        'GET /api/matches/:id': 'Get match by ID',
        'GET /api/matches/upcoming': 'Get upcoming matches',
        'GET /api/matches/recent': 'Get recent matches',
        'GET /api/matches/head-to-head/:id1/:id2': 'Get head-to-head',
        'POST /api/matches': 'Create new match',
        'POST /api/matches/:id/simulate': 'Simulate match',
        'PUT /api/matches/:id/result': 'Update match result',
        'DELETE /api/matches/:id': 'Delete match'
      }
    }
  });
});

// Mount routes
router.use('/countries', countryRoutes);
router.use('/competitions', competitionRoutes);
router.use('/matches', matchRoutes);

module.exports = router;