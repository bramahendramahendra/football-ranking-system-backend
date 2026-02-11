/**
 * Match Routes
 * Definisi routing untuk Match endpoints
 */

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const Validators = require('../utils/validators');
const validateRequest = require('../middlewares/validateRequest');
const { body } = require('express-validator');

/**
 * @route   GET /api/matches/upcoming
 * @desc    Get upcoming matches
 * @access  Public
 */
router.get(
  '/upcoming',
  validateRequest,
  matchController.getUpcomingMatches
);

/**
 * @route   GET /api/matches/recent
 * @desc    Get recent finished matches
 * @access  Public
 */
router.get(
  '/recent',
  validateRequest,
  matchController.getRecentMatches
);

/**
 * @route   GET /api/matches/head-to-head/:id1/:id2
 * @desc    Get head-to-head between two countries
 * @access  Public
 */
router.get(
  '/head-to-head/:id1/:id2',
  Validators.idParam('id1'),
  Validators.idParam('id2'),
  validateRequest,
  matchController.getHeadToHead
);

/**
 * @route   GET /api/matches
 * @desc    Get all matches with filters
 * @access  Public
 */
router.get(
  '/',
  Validators.pagination(),
  validateRequest,
  matchController.getAllMatches
);

/**
 * @route   GET /api/matches/:id
 * @desc    Get match by ID
 * @access  Public
 */
router.get(
  '/:id',
  Validators.idParam('id'),
  validateRequest,
  matchController.getMatchById
);

/**
 * @route   GET /api/matches/:id/events
 * @desc    Get match events
 * @access  Public
 */
router.get(
  '/:id/events',
  Validators.idParam('id'),
  validateRequest,
  matchController.getMatchEvents
);

/**
 * @route   POST /api/matches
 * @desc    Create new match
 * @access  Public
 */
router.post(
  '/',
  Validators.match(),
  validateRequest,
  matchController.createMatch
);

/**
 * @route   POST /api/matches/:id/simulate
 * @desc    Simulate match result
 * @access  Public
 */
router.post(
  '/:id/simulate',
  Validators.idParam('id'),
  validateRequest,
  matchController.simulateMatch
);

/**
 * @route   POST /api/matches/:id/events
 * @desc    Add match event
 * @access  Public
 */
router.post(
  '/:id/events',
  Validators.idParam('id'),
  [
    body('country_id').isInt().withMessage('Country ID must be an integer'),
    body('event_type')
      .isIn(['goal', 'own_goal', 'penalty_goal', 'yellow_card', 'red_card', 'substitution'])
      .withMessage('Invalid event type'),
    body('minute').isInt({ min: 0, max: 120 }).withMessage('Invalid minute'),
    body('player_name').optional().trim().isLength({ max: 100 })
  ],
  validateRequest,
  matchController.addMatchEvent
);

/**
 * @route   PUT /api/matches/:id/result
 * @desc    Update match result manually
 * @access  Public
 */
router.put(
  '/:id/result',
  Validators.idParam('id'),
  [
    body('score_home').isInt({ min: 0 }).withMessage('Home score must be a non-negative integer'),
    body('score_away').isInt({ min: 0 }).withMessage('Away score must be a non-negative integer'),
    body('penalties_home').optional().isInt({ min: 0 }).withMessage('Penalties home must be non-negative'),
    body('penalties_away').optional().isInt({ min: 0 }).withMessage('Penalties away must be non-negative')
  ],
  validateRequest,
  matchController.updateMatchResult
);

/**
 * @route   DELETE /api/matches/:id
 * @desc    Delete match
 * @access  Public
 */
router.delete(
  '/:id',
  Validators.idParam('id'),
  validateRequest,
  matchController.deleteMatch
);

module.exports = router;