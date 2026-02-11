/**
 * Competition Controller
 * Handle HTTP requests untuk Competition endpoints
 */

const competitionService = require('../services/competitionService');
const ResponseHandler = require('../utils/responseHandler');

class CompetitionController {
  /**
   * Get all competitions
   * GET /api/competitions
   */
  async getAllCompetitions(req, res, next) {
    try {
      const { type, confederation, status, year, page = 1, limit = 20 } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (confederation) filters.confederation = confederation;
      if (status) filters.status = status;
      if (year) filters.year = parseInt(year);

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await competitionService.getAllCompetitions(filters, pagination);

      return ResponseHandler.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        'Competitions retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get competition by ID
   * GET /api/competitions/:id
   */
  async getCompetitionById(req, res, next) {
    try {
      const { id } = req.params;
      const competition = await competitionService.getCompetitionById(id);

      return ResponseHandler.success(
        res,
        competition,
        'Competition retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new competition
   * POST /api/competitions
   */
  async createCompetition(req, res, next) {
    try {
      const competitionData = req.body;
      const competition = await competitionService.createCompetition(competitionData);

      return ResponseHandler.success(
        res,
        competition,
        'Competition created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update competition
   * PUT /api/competitions/:id
   */
  async updateCompetition(req, res, next) {
    try {
      const { id } = req.params;
      const competitionData = req.body;
      
      const competition = await competitionService.updateCompetition(id, competitionData);

      return ResponseHandler.success(
        res,
        competition,
        'Competition updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete competition
   * DELETE /api/competitions/:id
   */
  async deleteCompetition(req, res, next) {
    try {
      const { id } = req.params;
      const result = await competitionService.deleteCompetition(id);

      return ResponseHandler.success(
        res,
        result,
        'Competition deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add participants to competition
   * POST /api/competitions/:id/participants
   */
  async addParticipants(req, res, next) {
    try {
      const { id } = req.params;
      const { country_ids, groups } = req.body;

      const participants = await competitionService.addParticipants(
        id,
        country_ids,
        groups || {}
      );

      return ResponseHandler.success(
        res,
        participants,
        'Participants added successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove participant from competition
   * DELETE /api/competitions/:id/participants/:countryId
   */
  async removeParticipant(req, res, next) {
    try {
      const { id, countryId } = req.params;
      const result = await competitionService.removeParticipant(
        parseInt(id),
        parseInt(countryId)
      );

      return ResponseHandler.success(
        res,
        result,
        'Participant removed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get competition standings
   * GET /api/competitions/:id/standings
   */
  async getStandings(req, res, next) {
    try {
      const { id } = req.params;
      const standings = await competitionService.getStandings(id);

      return ResponseHandler.success(
        res,
        standings,
        'Standings retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get competition statistics
   * GET /api/competitions/:id/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const { id } = req.params;
      const statistics = await competitionService.getStatistics(id);

      return ResponseHandler.success(
        res,
        statistics,
        'Statistics retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get competition matches
   * GET /api/competitions/:id/matches
   */
  async getMatches(req, res, next) {
    try {
      const { id } = req.params;
      const { status, match_stage } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (match_stage) filters.match_stage = match_stage;

      const matches = await competitionService.getMatches(id, filters);

      return ResponseHandler.success(
        res,
        matches,
        'Matches retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompetitionController();