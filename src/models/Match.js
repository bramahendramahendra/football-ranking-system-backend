/**
 * Match Model
 * Model untuk mengelola data pertandingan
 */

const db = require('../../config/database');
const FIFACalculator = require('../utils/fifaCalculator');
const Country = require('./Country');
const Competition = require('./Competition');
const RecentForm = require('./RecentForm');

class Match {
  /**
   * Get all matches
   * @param {Object} filters - {competition_id, country_id, status, date_from, date_to}
   * @param {Object} pagination - {page, limit}
   */
  static async getAll(filters = {}, pagination = {}) {
    try {
      let query = `
        SELECT 
          m.*,
          ch.name as home_name,
          ch.code as home_code,
          ch.flag_url as home_flag,
          ca.name as away_name,
          ca.code as away_code,
          ca.flag_url as away_flag,
          c.name as competition_name,
          c.type as competition_type
        FROM matches m
        JOIN countries ch ON m.country_home_id = ch.id
        JOIN countries ca ON m.country_away_id = ca.id
        LEFT JOIN competitions c ON m.competition_id = c.id
        WHERE 1=1
      `;
      const queryParams = [];

      // Apply filters
      if (filters.competition_id) {
        query += ' AND m.competition_id = ?';
        queryParams.push(filters.competition_id);
      }

      if (filters.country_id) {
        query += ' AND (m.country_home_id = ? OR m.country_away_id = ?)';
        queryParams.push(filters.country_id, filters.country_id);
      }

      if (filters.status) {
        query += ' AND m.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.date_from) {
        query += ' AND m.match_date >= ?';
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND m.match_date <= ?';
        queryParams.push(filters.date_to);
      }

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countResult] = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Apply sorting
      query += ' ORDER BY m.match_date DESC';

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const offset = (pagination.page - 1) * pagination.limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(pagination.limit), parseInt(offset));
      }

      const [rows] = await db.query(query, queryParams);

      return {
        data: rows,
        total,
        page: pagination.page || 1,
        limit: pagination.limit || total
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get match by ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          m.*,
          ch.name as home_name,
          ch.code as home_code,
          ch.flag_url as home_flag,
          ch.fifa_points as home_fifa_points,
          ch.world_ranking as home_world_ranking,
          ch.confederation as home_confederation,
          ca.name as away_name,
          ca.code as away_code,
          ca.flag_url as away_flag,
          ca.fifa_points as away_fifa_points,
          ca.world_ranking as away_world_ranking,
          ca.confederation as away_confederation,
          c.name as competition_name,
          c.type as competition_type,
          c.match_importance_factor as competition_importance
        FROM matches m
        JOIN countries ch ON m.country_home_id = ch.id
        JOIN countries ca ON m.country_away_id = ca.id
        LEFT JOIN competitions c ON m.competition_id = c.id
        WHERE m.id = ?
      `;
      
      const [rows] = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new match (scheduled)
   */
  static async create(matchData) {
    try {
      const query = `
        INSERT INTO matches 
        (competition_id, country_home_id, country_away_id, match_date, 
         match_stage, is_neutral_venue, venue, match_importance_factor, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        matchData.competition_id || null,
        matchData.country_home_id,
        matchData.country_away_id,
        matchData.match_date,
        matchData.match_stage || null,
        matchData.is_neutral_venue || false,
        matchData.venue || null,
        matchData.match_importance_factor || 1.0,
        matchData.status || 'scheduled'
      ]);

      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulate match and update result
   */
  static async simulateMatch(matchId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get match details
      const match = await this.getById(matchId);
      
      if (!match) {
        throw new Error('Match not found');
      }

      if (match.status === 'finished') {
        throw new Error('Match already finished');
      }

      // Get full team data with recent form
      const homeTeam = await Country.getById(match.country_home_id);
      const awayTeam = await Country.getById(match.country_away_id);

      // Calculate match probability
      const probability = FIFACalculator.calculateMatchProbability(
        homeTeam,
        awayTeam,
        match.is_neutral_venue
      );

      // Simulate score
      const { scoreHome, scoreAway } = FIFACalculator.simulateMatchScore(probability);

      // Update match with result
      await connection.query(
        `UPDATE matches 
         SET score_home = ?, score_away = ?, status = 'finished'
         WHERE id = ?`,
        [scoreHome, scoreAway, matchId]
      );

      // Process match result (update FIFA points, rankings, etc)
      await this.processMatchResult(matchId, connection);

      await connection.commit();

      return await this.getById(matchId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update match result manually
   */
  static async updateResult(matchId, scoreHome, scoreAway, penaltiesHome = null, penaltiesAway = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update match score
      await connection.query(
        `UPDATE matches 
         SET score_home = ?, score_away = ?, penalties_home = ?, penalties_away = ?, status = 'finished'
         WHERE id = ?`,
        [scoreHome, scoreAway, penaltiesHome, penaltiesAway, matchId]
      );

      // Process match result
      await this.processMatchResult(matchId, connection);

      await connection.commit();

      return await this.getById(matchId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process match result - update FIFA points, rankings, recent form, competition stats
   * @private
   */
  static async processMatchResult(matchId, connection) {
    try {
      // Get match details
      const [matches] = await connection.query(
        `SELECT m.*, c.match_importance_factor as comp_importance
         FROM matches m
         LEFT JOIN competitions c ON m.competition_id = c.id
         WHERE m.id = ?`,
        [matchId]
      );

      const match = matches[0];

      if (!match || match.score_home === null || match.score_away === null) {
        throw new Error('Match result not available');
      }

      // Get team data
      const [homeTeam] = await connection.query(
        'SELECT * FROM countries WHERE id = ?',
        [match.country_home_id]
      );
      const [awayTeam] = await connection.query(
        'SELECT * FROM countries WHERE id = ?',
        [match.country_away_id]
      );

      const home = homeTeam[0];
      const away = awayTeam[0];

      // Use competition importance or match importance
      const matchImportance = match.comp_importance || match.match_importance_factor;

      // Calculate FIFA points
      const pointsResult = FIFACalculator.calculatePointsAfterMatch(
        home,
        away,
        match.score_home,
        match.score_away,
        matchImportance,
        match.is_neutral_venue
      );

      // Update FIFA points for both teams
      await connection.query(
        'UPDATE countries SET fifa_points = ? WHERE id = ?',
        [pointsResult.homeNewTotal, match.country_home_id]
      );
      await connection.query(
        'UPDATE countries SET fifa_points = ? WHERE id = ?',
        [pointsResult.awayNewTotal, match.country_away_id]
      );

      // Update rankings
      await connection.query('CALL UpdateWorldRankings()');
      await connection.query('CALL UpdateConfederationRankings()');

      // Update recent form
      const homeResult = match.score_home > match.score_away ? 'W' :
                        match.score_home < match.score_away ? 'L' : 'D';
      const awayResult = match.score_away > match.score_home ? 'W' :
                        match.score_away < match.score_home ? 'L' : 'D';

      await RecentForm.updateForm(match.country_home_id, homeResult, connection);
      await RecentForm.updateForm(match.country_away_id, awayResult, connection);

      // Update competition participant stats if match is part of competition
      if (match.competition_id) {
        // Home team stats
        const homeStats = {
          won: homeResult === 'W' ? 1 : 0,
          drawn: homeResult === 'D' ? 1 : 0,
          lost: homeResult === 'L' ? 1 : 0,
          goals_for: match.score_home,
          goals_against: match.score_away,
          points: homeResult === 'W' ? 3 : homeResult === 'D' ? 1 : 0
        };

        // Away team stats
        const awayStats = {
          won: awayResult === 'W' ? 1 : 0,
          drawn: awayResult === 'D' ? 1 : 0,
          lost: awayResult === 'L' ? 1 : 0,
          goals_for: match.score_away,
          goals_against: match.score_home,
          points: awayResult === 'W' ? 3 : awayResult === 'D' ? 1 : 0
        };

        await Competition.updateParticipantStats(
          match.competition_id,
          match.country_home_id,
          homeStats
        );
        await Competition.updateParticipantStats(
          match.competition_id,
          match.country_away_id,
          awayStats
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete match
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM matches WHERE id = ?';
      const [result] = await db.query(query, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get match events (goals, cards, etc)
   */
  static async getEvents(matchId) {
    try {
      const query = `
        SELECT 
          me.*,
          c.name as country_name,
          c.flag_url
        FROM match_events me
        JOIN countries c ON me.country_id = c.id
        WHERE me.match_id = ?
        ORDER BY me.minute ASC, me.additional_time ASC
      `;
      
      const [rows] = await db.query(query, [matchId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add match event
   */
  static async addEvent(eventData) {
    try {
      const query = `
        INSERT INTO match_events 
        (match_id, country_id, player_name, event_type, minute, additional_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        eventData.match_id,
        eventData.country_id,
        eventData.player_name || null,
        eventData.event_type,
        eventData.minute,
        eventData.additional_time || 0
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get head-to-head between two countries
   */
  static async getHeadToHead(countryId1, countryId2, limit = 10) {
    try {
      const query = `
        SELECT 
          m.*,
          ch.name as home_name,
          ch.flag_url as home_flag,
          ca.name as away_name,
          ca.flag_url as away_flag,
          c.name as competition_name
        FROM matches m
        JOIN countries ch ON m.country_home_id = ch.id
        JOIN countries ca ON m.country_away_id = ca.id
        LEFT JOIN competitions c ON m.competition_id = c.id
        WHERE m.status = 'finished'
          AND ((m.country_home_id = ? AND m.country_away_id = ?)
               OR (m.country_home_id = ? AND m.country_away_id = ?))
        ORDER BY m.match_date DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [
        countryId1, countryId2,
        countryId2, countryId1,
        limit
      ]);

      // Calculate statistics
      let country1Wins = 0;
      let country2Wins = 0;
      let draws = 0;

      rows.forEach(match => {
        if (match.country_home_id === countryId1) {
          if (match.score_home > match.score_away) country1Wins++;
          else if (match.score_home < match.score_away) country2Wins++;
          else draws++;
        } else {
          if (match.score_away > match.score_home) country1Wins++;
          else if (match.score_away < match.score_home) country2Wins++;
          else draws++;
        }
      });

      return {
        matches: rows,
        statistics: {
          total: rows.length,
          country1_wins: country1Wins,
          country2_wins: country2Wins,
          draws: draws
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get upcoming matches
   */
  static async getUpcoming(limit = 10) {
    try {
      const query = `
        SELECT 
          m.*,
          ch.name as home_name,
          ch.flag_url as home_flag,
          ca.name as away_name,
          ca.flag_url as away_flag,
          c.name as competition_name
        FROM matches m
        JOIN countries ch ON m.country_home_id = ch.id
        JOIN countries ca ON m.country_away_id = ca.id
        LEFT JOIN competitions c ON m.competition_id = c.id
        WHERE m.status IN ('scheduled', 'live')
          AND m.match_date >= NOW()
        ORDER BY m.match_date ASC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent finished matches
   */
  static async getRecentFinished(limit = 10) {
    try {
      const query = `
        SELECT 
          m.*,
          ch.name as home_name,
          ch.flag_url as home_flag,
          ca.name as away_name,
          ca.flag_url as away_flag,
          c.name as competition_name
        FROM matches m
        JOIN countries ch ON m.country_home_id = ch.id
        JOIN countries ca ON m.country_away_id = ca.id
        LEFT JOIN competitions c ON m.competition_id = c.id
        WHERE m.status = 'finished'
        ORDER BY m.match_date DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Match;