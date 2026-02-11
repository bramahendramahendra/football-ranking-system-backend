/**
 * Country Routes
 * Definisi routing untuk Country endpoints
 */

const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const Validators = require('../utils/validators');
const validateRequest = require('../middlewares/validateRequest');

/**
 * @route   GET /api/countries
 * @desc    Get all countries with filters
 * @access  Public
 */
router.get(
  '/',
  Validators.pagination(),
  Validators.confederationFilter(),
  validateRequest,
  countryController.getAllCountries
);

/**
 * @route   GET /api/countries/rankings/world
 * @desc    Get world rankings
 * @access  Public
 */
router.get(
  '/rankings/world',
  Validators.pagination(),
  validateRequest,
  countryController.getWorldRankings
);

/**
 * @route   GET /api/countries/rankings/confederation/:confederation
 * @desc    Get confederation rankings
 * @access  Public
 */
router.get(
  '/rankings/confederation/:confederation',
  Validators.pagination(),
  validateRequest,
  countryController.getConfederationRankings
);

/**
 * @route   GET /api/countries/compare/:id1/:id2
 * @desc    Compare two countries
 * @access  Public
 */
router.get(
  '/compare/:id1/:id2',
  Validators.idParam('id1'),
  Validators.idParam('id2'),
  validateRequest,
  countryController.compareCountries
);

/**
 * @route   GET /api/countries/:id
 * @desc    Get country by ID
 * @access  Public
 */
router.get(
  '/:id',
  Validators.idParam('id'),
  validateRequest,
  countryController.getCountryById
);

/**
 * @route   GET /api/countries/:id/ranking-history
 * @desc    Get ranking history for a country
 * @access  Public
 */
router.get(
  '/:id/ranking-history',
  Validators.idParam('id'),
  validateRequest,
  countryController.getRankingHistory
);

/**
 * @route   POST /api/countries
 * @desc    Create new country
 * @access  Public
 */
router.post(
  '/',
  Validators.country(),
  validateRequest,
  countryController.createCountry
);

/**
 * @route   PUT /api/countries/:id
 * @desc    Update country
 * @access  Public
 */
router.put(
  '/:id',
  Validators.idParam('id'),
  Validators.country(),
  validateRequest,
  countryController.updateCountry
);

/**
 * @route   DELETE /api/countries/:id
 * @desc    Delete country (soft delete)
 * @access  Public
 */
router.delete(
  '/:id',
  Validators.idParam('id'),
  validateRequest,
  countryController.deleteCountry
);

module.exports = router;