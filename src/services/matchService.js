/**
 * Match Service
 * Business logic untuk operasi Match
 */

const Match = require('../models/Match');
const Competition = require('../models/Competition');
const Country = require('../models/Country');

class MatchService {
  /**
   * Get all matches
   */
  async getAllMatches(filters, pagination) {
    try {
      const result = await Match.getAll(filters, pagination);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get match by ID
   */
  async getMatchById(id) {
    try {
      const match = await Match.getById(id);
      
      if (!match) {
        const error = new Error('Match not found');
        error.statusCode = 404;
        throw error;
      }

      // Get match events
      const events = await Match.getEvents(id);

      return {
        ...match,
        events
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new match
   */
  async createMatch(matchData) {
    try {
      // Validate countries
      const homeCountry = await Country.getById(matchData.country_home_id);
      const awayCountry = await Country.getById(matchData.country_away_id);

      if (!homeCountry || !awayCountry) {
        const error = new Error('One or both countries not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate competition if provided
      if (matchData.competition_id) {
        const competition = await Competition.getById(matchData.competition_id);
        if (!competition) {
          const error = new Error('Competition not found');
          error.statusCode = 404;
          throw error;
        }

        // Use competition's match importance factor if not specified
        if (!matchData.match_importance_factor) {
          matchData.match_importance_factor = competition.match_importance_factor;
        }
      }

      const match = await Match.create(matchData);
      return match;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulate match
   */
  async simulateMatch(id) {
    try {
      const match = await Match.getById(id);
      
      if (!match) {
        const error = new Error('Match not found');
        error.statusCode = 404;
        throw error;
      }

      if (match.status === 'finished') {
        const error = new Error('Match already finished');
        error.statusCode = 400;
        throw error;
      }

      const simulatedMatch = await Match.simulateMatch(id);
      return simulatedMatch;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update match result manually
   */
  async updateMatchResult(id, scoreHome, scoreAway, penaltiesHome, penaltiesAway) {
    try {
      const match = await Match.getById(id);
      
      if (!match) {
        const error = new Error('Match not found');
        error.statusCode = 404;
        throw error;
      }

      const updatedMatch = await Match.updateResult(
        id,
        scoreHome,
        scoreAway,
        penaltiesHome,
        penaltiesAway
      );

      return updatedMatch;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete match
   */
  async deleteMatch(id) {
    try {
      const match = await Match.getById(id);
      
      if (!match) {
        const error = new Error('Match not found');
        error.statusCode = 404;
        throw error;
      }

      if (match.status === 'finished') {
        const error = new Error('Cannot delete finished match. This would affect FIFA points and rankings.');
        error.statusCode = 400;
        throw error;
      }

      const result = await Match.delete(id);
      
      if (!result) {
        const error = new Error('Failed to delete match');
        error.statusCode = 500;
        throw error;
      }

      return { message: 'Match deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get head-to-head between two countries
   */
  async getHeadToHead(countryId1, countryId2, limit) {
    try {
      const country1 = await Country.getById(countryId1);
      const country2 = await Country.getById(countryId2);

      if (!country1 || !country2) {
        const error = new Error('One or both countries not found');
        error.statusCode = 404;
        throw error;
      }

      const h2h = await Match.getHeadToHead(countryId1, countryId2, limit);
      
      return {
        country1: {
          id: country1.id,
          name: country1.name,
          flag_url: country1.flag_url
        },
        country2: {
          id: country2.id,
          name: country2.name,
          flag_url: country2.flag_url
        },
        ...h2h
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get upcoming matches
   */
  async getUpcomingMatches(limit) {
    try {
      const matches = await Match.getUpcoming(limit);
      return matches;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent finished matches
   */
  async getRecentMatches(limit) {
    try {
      const matches = await Match.getRecentFinished(limit);
      return matches;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add match event
   */
  async addMatchEvent(matchId, eventData) {
    try {
      const match = await Match.getById(matchId);
      
      if (!match) {
        const error = new Error('Match not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate country is in the match
      if (eventData.country_id !== match.country_home_id && 
          eventData.country_id !== match.country_away_id) {
        const error = new Error('Country is not participating in this match');
        error.statusCode = 400;
        throw error;
      }

      eventData.match_id = matchId;
      const eventId = await Match.addEvent(eventData);
      
      return { 
        message: 'Event added successfully',
        event_id: eventId
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get match events
   */
  async getMatchEvents(matchId) {
    try {
      const match = await Match.getById(matchId);
      
      if (!match) {
        const error = new Error('Match not found');
        error.statusCode = 404;
        throw error;
      }

      const events = await Match.getEvents(matchId);
      return events;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MatchService();