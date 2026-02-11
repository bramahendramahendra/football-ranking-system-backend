/**
 * Country Controller
 * Handle HTTP requests untuk Country endpoints
 */

const countryService = require('../services/countryService');
const ResponseHandler = require('../utils/responseHandler');

class CountryController {
  /**
   * Get all countries
   * GET /api/countries
   */
  async getAllCountries(req, res, next) {
    try {
      const { confederation, search, page = 1, limit = 20, sort_by = 'world_ranking', sort_order = 'ASC' } = req.query;

      const filters = {};
      if (confederation) filters.confederation = confederation;
      if (search) filters.search = search;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await countryService.getAllCountries(
        filters,
        pagination,
        sort_by,
        sort_order
      );

      return ResponseHandler.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        'Countries retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get country by ID
   * GET /api/countries/:id
   */
  async getCountryById(req, res, next) {
    try {
      const { id } = req.params;
      const country = await countryService.getCountryById(id);

      return ResponseHandler.success(
        res,
        country,
        'Country retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new country
   * POST /api/countries
   */
  async createCountry(req, res, next) {
    try {
      const countryData = req.body;
      const country = await countryService.createCountry(countryData);

      return ResponseHandler.success(
        res,
        country,
        'Country created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update country
   * PUT /api/countries/:id
   */
  async updateCountry(req, res, next) {
    try {
      const { id } = req.params;
      const countryData = req.body;
      
      const country = await countryService.updateCountry(id, countryData);

      return ResponseHandler.success(
        res,
        country,
        'Country updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete country
   * DELETE /api/countries/:id
   */
  async deleteCountry(req, res, next) {
    try {
      const { id } = req.params;
      const result = await countryService.deleteCountry(id);

      return ResponseHandler.success(
        res,
        result,
        'Country deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get world rankings
   * GET /api/countries/rankings/world
   */
  async getWorldRankings(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await countryService.getWorldRankings({}, pagination);

      return ResponseHandler.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        'World rankings retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get confederation rankings
   * GET /api/countries/rankings/confederation/:confederation
   */
  async getConfederationRankings(req, res, next) {
    try {
      const { confederation } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await countryService.getConfederationRankings(
        confederation,
        pagination
      );

      return ResponseHandler.success(
        res,
        result,
        'Confederation rankings retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ranking history
   * GET /api/countries/:id/ranking-history
   */
  async getRankingHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      const result = await countryService.getRankingHistory(id, parseInt(limit));

      return ResponseHandler.success(
        res,
        result,
        'Ranking history retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare two countries
   * GET /api/countries/compare/:id1/:id2
   */
  async compareCountries(req, res, next) {
    try {
      const { id1, id2 } = req.params;

      const comparison = await countryService.compareCountries(
        parseInt(id1),
        parseInt(id2)
      );

      return ResponseHandler.success(
        res,
        comparison,
        'Countries comparison retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CountryController();