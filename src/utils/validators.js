/**
 * Input Validators
 * Fungsi-fungsi untuk validasi input
 */

const { body, param, query } = require('express-validator');

class Validators {
  /**
   * Validator untuk create/update country
   */
  static country() {
    return [
      body('name')
        .trim()
        .notEmpty().withMessage('Country name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Country name must be between 2-100 characters'),
      
      body('code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 }).withMessage('Country code must be exactly 3 characters')
        .isAlpha().withMessage('Country code must contain only letters'),
      
      body('confederation')
        .notEmpty().withMessage('Confederation is required')
        .isIn(['UEFA', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC'])
        .withMessage('Invalid confederation'),
      
      body('flag_url')
        .optional()
        .trim()
        .isURL().withMessage('Invalid flag URL'),
      
      body('fifa_points')
        .optional()
        .isFloat({ min: 0 }).withMessage('FIFA points must be a positive number')
    ];
  }

  /**
   * Validator untuk create competition
   */
  static competition() {
    return [
      body('name')
        .trim()
        .notEmpty().withMessage('Competition name is required')
        .isLength({ min: 3, max: 150 }).withMessage('Competition name must be between 3-150 characters'),
      
      body('year')
        .notEmpty().withMessage('Year is required')
        .isInt({ min: 1900, max: 2100 }).withMessage('Invalid year'),
      
      body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(['world', 'continental']).withMessage('Type must be either world or continental'),
      
      body('confederation')
        .optional()
        .isIn(['FIFA', 'UEFA', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC'])
        .withMessage('Invalid confederation'),
      
      body('format')
        .optional()
        .isIn(['group', 'knockout', 'league', 'group_knockout'])
        .withMessage('Invalid format'),
      
      body('host_country_id')
        .optional()
        .isInt().withMessage('Host country ID must be an integer'),
      
      body('match_importance_factor')
        .optional()
        .isFloat({ min: 1.0, max: 4.0 }).withMessage('Match importance factor must be between 1.0 and 4.0'),
      
      body('start_date')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
      
      body('end_date')
        .optional()
        .isISO8601().withMessage('Invalid end date format')
    ];
  }

  /**
   * Validator untuk create/update match
   */
  static match() {
    return [
      body('competition_id')
        .optional()
        .isInt().withMessage('Competition ID must be an integer'),
      
      body('country_home_id')
        .notEmpty().withMessage('Home country ID is required')
        .isInt().withMessage('Home country ID must be an integer'),
      
      body('country_away_id')
        .notEmpty().withMessage('Away country ID is required')
        .isInt().withMessage('Away country ID must be an integer')
        .custom((value, { req }) => {
          if (value === req.body.country_home_id) {
            throw new Error('Home and away countries must be different');
          }
          return true;
        }),
      
      body('score_home')
        .optional()
        .isInt({ min: 0, max: 20 }).withMessage('Home score must be between 0 and 20'),
      
      body('score_away')
        .optional()
        .isInt({ min: 0, max: 20 }).withMessage('Away score must be between 0 and 20'),
      
      body('match_date')
        .notEmpty().withMessage('Match date is required')
        .isISO8601().withMessage('Invalid match date format'),
      
      body('match_stage')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Match stage must be max 50 characters'),
      
      body('is_neutral_venue')
        .optional()
        .isBoolean().withMessage('is_neutral_venue must be boolean'),
      
      body('venue')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Venue must be max 200 characters'),
      
      body('match_importance_factor')
        .optional()
        .isFloat({ min: 1.0, max: 4.0 }).withMessage('Match importance factor must be between 1.0 and 4.0')
    ];
  }

  /**
   * Validator untuk ID parameter
   */
  static idParam(paramName = 'id') {
    return [
      param(paramName)
        .isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`)
    ];
  }

  /**
   * Validator untuk pagination query
   */
  static pagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ];
  }

  /**
   * Validator untuk filter confederation
   */
  static confederationFilter() {
    return [
      query('confederation')
        .optional()
        .isIn(['UEFA', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC'])
        .withMessage('Invalid confederation')
    ];
  }

  /**
   * Validator untuk add participants to competition
   */
  static addParticipants() {
    return [
      body('country_ids')
        .isArray({ min: 2 }).withMessage('At least 2 countries are required')
        .custom((value) => {
          if (!value.every(id => Number.isInteger(id) && id > 0)) {
            throw new Error('All country IDs must be positive integers');
          }
          return true;
        }),
      
      body('groups')
        .optional()
        .isObject().withMessage('Groups must be an object')
    ];
  }
}

module.exports = Validators;