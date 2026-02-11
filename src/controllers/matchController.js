/**
 * Match Controller
 * Handle HTTP requests untuk Match endpoints
 */

const matchService = require('../services/matchService');
const ResponseHandler = require('../utils/responseHandler');

class MatchController {
  /**
   * Get all matches
   * GET /api/matches
   */
  async getAllMatches(req, res, next) {
    try {
      const {
        competition_id,
        country_id,
        status,
        date_from,
        date_to,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {};
      if (competition_id) filters.competition_id = parseInt(competition_id);
      if (country_id) filters.country_id = parseInt(country_id);
      if (status) filters.status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await matchService.getAllMatches(filters, pagination);

      return ResponseHandler.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        'Matches retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get match by ID
   * GET /api/matches/:id
   */
  async getMatchById(req, res, next) {
    try {
      const { id } = req.params;
      const match = await matchService.getMatchById(id);

      return ResponseHandler.success(
        res,
        match,
        'Match retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new match
   * POST /api/matches
   */
  async createMatch(req, res, next) {
    try {
      const matchData = req.body;
      const match = await matchService.createMatch(matchData);

      return ResponseHandler.success(
        res,
        match,
        'Match created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simulate match
   * POST /api/matches/:id/simulate
   */
  async simulateMatch(req, res, next) {
    try {
      const { id } = req.params;
      const match = await matchService.simulateMatch(id);

      return ResponseHandler.success(
        res,
        match,
        'Match simulated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update match result
   * PUT /api/matches/:id/result
   */
  async updateMatchResult(req, res, next) {
    try {
      const { id } = req.params;
      const { score_home, score_away, penalties_home, penalties_away } = req.body;

      const match = await matchService.updateMatchResult(
        id,
        score_home,
        score_away,
        penalties_home,
        penalties_away
      );

      return ResponseHandler.success(
        res,
        match,
        'Match result updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete match
   * DELETE /api/matches/:id
   */
  async deleteMatch(req, res, next) {
    try {
      const { id } = req.params;
      const result = await matchService.deleteMatch(id);

      return ResponseHandler.success(
        res,
        result,
        'Match deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get head-to-head
   * GET /api/matches/head-to-head/:id1/:id2
   */
  async getHeadToHead(req, res, next) {
    try {
      const { id1, id2 } = req.params;
      const { limit = 10 } = req.query;

      const h2h = await matchService.getHeadToHead(
        parseInt(id1),
        parseInt(id2),
        parseInt(limit)
      );

      return ResponseHandler.success(
        res,
        h2h,
        'Head-to-head retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming matches
   * GET /api/matches/upcoming
   */
  async getUpcomingMatches(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const matches = await matchService.getUpcomingMatches(parseInt(limit));

      return ResponseHandler.success(
        res,
        matches,
        'Upcoming matches retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent matches
   * GET /api/matches/recent
   */
  async getRecentMatches(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const matches = await matchService.getRecentMatches(parseInt(limit));

      return ResponseHandler.success(
        res,
        matches,
        'Recent matches retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add match event
   * POST /api/matches/:id/events
   */
  async addMatchEvent(req, res, next) {
    try {
      const { id } = req.params;
      const eventData = req.body;

      const result = await matchService.addMatchEvent(id, eventData);

      return ResponseHandler.success(
        res,
        result,
        'Match event added successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get match events
   * GET /api/matches/:id/events
   */
  async getMatchEvents(req, res, next) {
    try {
      const { id } = req.params;
      const events = await matchService.getMatchEvents(id);

      return ResponseHandler.success(
        res,
        events,
        'Match events retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MatchController();