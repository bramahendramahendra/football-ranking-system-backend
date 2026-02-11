/**
 * Competition Service
 * Business logic untuk operasi Competition
 */

const Competition = require('../models/Competition');
const Country = require('../models/Country');

class CompetitionService {
  /**
   * Get all competitions
   */
  async getAllCompetitions(filters, pagination) {
    try {
      const result = await Competition.getAll(filters, pagination);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get competition by ID with full details
   */
  async getCompetitionById(id) {
    try {
      const competition = await Competition.getById(id);
      
      if (!competition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      // Get participants
      const participants = await Competition.getParticipants(id);

      // Get standings if format is group or league
      let standings = null;
      if (competition.format === 'group' || competition.format === 'league' || competition.format === 'group_knockout') {
        standings = await Competition.getStandings(id);
      }

      // Get matches
      const matches = await Competition.getMatches(id);

      // Get statistics
      const statistics = await Competition.getStatistics(id);

      // Get top scorers
      const topScorers = await Competition.getTopScorers(id, 10);

      return {
        ...competition,
        participants,
        standings,
        matches,
        statistics,
        top_scorers: topScorers
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new competition
   */
  async createCompetition(competitionData) {
    try {
      // Validate host country if provided
      if (competitionData.host_country_id) {
        const hostCountry = await Country.getById(competitionData.host_country_id);
        if (!hostCountry) {
          const error = new Error('Host country not found');
          error.statusCode = 404;
          throw error;
        }
      }

      const competition = await Competition.create(competitionData);
      return competition;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update competition
   */
  async updateCompetition(id, competitionData) {
    try {
      const existingCompetition = await Competition.getById(id);
      
      if (!existingCompetition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      const updatedCompetition = await Competition.update(id, competitionData);
      return updatedCompetition;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete competition
   */
  async deleteCompetition(id) {
    try {
      const existingCompetition = await Competition.getById(id);
      
      if (!existingCompetition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      const result = await Competition.delete(id);
      
      if (!result) {
        const error = new Error('Failed to delete competition');
        error.statusCode = 500;
        throw error;
      }

      return { message: 'Competition deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add participants to competition
   */
  async addParticipants(id, countryIds, groups) {
    try {
      const competition = await Competition.getById(id);
      
      if (!competition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate all countries exist
      for (const countryId of countryIds) {
        const country = await Country.getById(countryId);
        if (!country) {
          const error = new Error(`Country with ID ${countryId} not found`);
          error.statusCode = 404;
          throw error;
        }
      }

      const participants = await Competition.addParticipants(id, countryIds, groups);
      return participants;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove participant from competition
   */
  async removeParticipant(competitionId, countryId) {
    try {
      const competition = await Competition.getById(competitionId);
      
      if (!competition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      const result = await Competition.removeParticipant(competitionId, countryId);
      
      if (!result) {
        const error = new Error('Participant not found in this competition');
        error.statusCode = 404;
        throw error;
      }

      return { message: 'Participant removed successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get competition standings
   */
  async getStandings(id) {
    try {
      const competition = await Competition.getById(id);
      
      if (!competition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      if (competition.format === 'knockout') {
        const error = new Error('Standings are not available for knockout format');
        error.statusCode = 400;
        throw error;
      }

      const standings = await Competition.getStandings(id);
      return standings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get competition statistics
   */
  async getStatistics(id) {
    try {
      const competition = await Competition.getById(id);
      
      if (!competition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      const statistics = await Competition.getStatistics(id);
      const topScorers = await Competition.getTopScorers(id, 10);

      return {
        ...statistics,
        top_scorers: topScorers
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get matches in competition
   */
  async getMatches(id, filters) {
    try {
      const competition = await Competition.getById(id);
      
      if (!competition) {
        const error = new Error('Competition not found');
        error.statusCode = 404;
        throw error;
      }

      const matches = await Competition.getMatches(id, filters);
      return matches;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CompetitionService();