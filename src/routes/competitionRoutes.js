/**
 * Competition Routes
 * Definisi routing untuk Competition endpoints
 */

const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const Validators = require('../utils/validators');
const validateRequest = require('../middlewares/validateRequest');

/**
 * @route   GET /api/competitions
 * @desc    Get all competitions with filters
 * @access  Public
 */
router.get(
  '/',
  Validators.pagination(),
  validateRequest,
  competitionController.getAllCompetitions
);

/**
 * @route   GET /api/competitions/:id
 * @desc    Get competition by ID with full details
 * @access  Public
 */
router.get(
  '/:id',
  Validators.idParam('id'),
  validateRequest,
  competitionController.getCompetitionById
);

/**
 * @route   GET /api/competitions/:id/standings
 * @desc    Get competition standings
 * @access  Public
 */
router.get(
  '/:id/standings',
  Validators.idParam('id'),
  validateRequest,
  competitionController.getStandings
);

/**
 * @route   GET /api/competitions/:id/statistics
 * @desc    Get competition statistics
 * @access  Public
 */
router.get(
  '/:id/statistics',
  Validators.idParam('id'),
  validateRequest,
  competitionController.getStatistics
);

/**
 * @route   GET /api/competitions/:id/matches
 * @desc    Get competition matches
 * @access  Public
 */
router.get(
  '/:id/matches',
  Validators.idParam('id'),
  validateRequest,
  competitionController.getMatches
);

/**
 * @route   POST /api/competitions
 * @desc    Create new competition
 * @access  Public
 */
router.post(
  '/',
  Validators.competition(),
  validateRequest,
  competitionController.createCompetition
);

/**
 * @route   POST /api/competitions/:id/participants
 * @desc    Add participants to competition
 * @access  Public
 */
router.post(
  '/:id/participants',
  Validators.idParam('id'),
  Validators.addParticipants(),
  validateRequest,
  competitionController.addParticipants
);

/**
 * @route   PUT /api/competitions/:id
 * @desc    Update competition
 * @access  Public
 */
router.put(
  '/:id',
  Validators.idParam('id'),
  Validators.competition(),
  validateRequest,
  competitionController.updateCompetition
);

/**
 * @route   DELETE /api/competitions/:id
 * @desc    Delete competition
 * @access  Public
 */
router.delete(
  '/:id',
  Validators.idParam('id'),
  validateRequest,
  competitionController.deleteCompetition
);

/**
 * @route   DELETE /api/competitions/:id/participants/:countryId
 * @desc    Remove participant from competition
 * @access  Public
 */
router.delete(
  '/:id/participants/:countryId',
  Validators.idParam('id'),
  Validators.idParam('countryId'),
  validateRequest,
  competitionController.removeParticipant
);

module.exports = router;