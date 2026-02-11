/**
 * Recent Form Model
 * Model untuk mengelola recent form (10 pertandingan terakhir)
 */

const db = require('../../config/database');
const FIFACalculator = require('../utils/fifaCalculator');

class RecentForm {
  /**
   * Get recent form by country ID
   */
  static async getByCountryId(countryId) {
    try {
      const query = `
        SELECT *
        FROM recent_forms
        WHERE country_id = ?
      `;
      
      const [rows] = await db.query(query, [countryId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update form after match
   * @param {number} countryId
   * @param {string} result - 'W', 'D', or 'L'
   * @param {Object} connection - Database connection (optional, for transaction)
   */
  static async updateForm(countryId, result, connection = null) {
    const conn = connection || db;
    
    try {
      // Get current form
      const [currentForm] = await conn.query(
        'SELECT last_10_matches FROM recent_forms WHERE country_id = ?',
        [countryId]
      );

      let formString = '';
      if (currentForm.length > 0) {
        formString = currentForm[0].last_10_matches || '';
      }

      // Update form string
      const newFormString = FIFACalculator.updateRecentForm(formString, result);

      // Calculate stats
      const stats = FIFACalculator.calculateFormStats(newFormString);

      // Update or insert
      const query = `
        INSERT INTO recent_forms 
        (country_id, last_10_matches, wins, draws, losses, win_percentage)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          last_10_matches = VALUES(last_10_matches),
          wins = VALUES(wins),
          draws = VALUES(draws),
          losses = VALUES(losses),
          win_percentage = VALUES(win_percentage)
      `;

      await conn.query(query, [
        countryId,
        newFormString,
        stats.wins,
        stats.draws,
        stats.losses,
        stats.winPercentage
      ]);

      return await this.getByCountryId(countryId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all forms
   */
  static async getAll() {
    try {
      const query = `
        SELECT 
          rf.*,
          c.name as country_name,
          c.flag_url
        FROM recent_forms rf
        JOIN countries c ON rf.country_id = c.id
        WHERE c.is_active = TRUE
        ORDER BY rf.win_percentage DESC
      `;
      
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get top form teams
   */
  static async getTopForm(limit = 10) {
    try {
      const query = `
        SELECT 
          rf.*,
          c.name as country_name,
          c.code as country_code,
          c.flag_url,
          c.world_ranking
        FROM recent_forms rf
        JOIN countries c ON rf.country_id = c.id
        WHERE c.is_active = TRUE
          AND LENGTH(rf.last_10_matches) >= 5
        ORDER BY rf.win_percentage DESC, rf.wins DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset form (for testing or maintenance)
   */
  static async resetForm(countryId) {
    try {
      const query = `
        UPDATE recent_forms
        SET 
          last_10_matches = '',
          wins = 0,
          draws = 0,
          losses = 0,
          win_percentage = 0
        WHERE country_id = ?
      `;
      
      await db.query(query, [countryId]);
      return await this.getByCountryId(countryId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recalculate all forms from match history
   * Useful for data migration or fixes
   */
  static async recalculateAllFromHistory() {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get all countries
      const [countries] = await connection.query(
        'SELECT id FROM countries WHERE is_active = TRUE'
      );

      for (const country of countries) {
        // Get last 10 matches
        const [matches] = await connection.query(
          `SELECT 
             country_home_id, country_away_id, score_home, score_away
           FROM matches
           WHERE status = 'finished'
             AND (country_home_id = ? OR country_away_id = ?)
           ORDER BY match_date DESC
           LIMIT 10`,
          [country.id, country.id]
        );

        let formString = '';
        matches.reverse().forEach(match => {
          let result;
          if (match.country_home_id === country.id) {
            result = match.score_home > match.score_away ? 'W' :
                    match.score_home < match.score_away ? 'L' : 'D';
          } else {
            result = match.score_away > match.score_home ? 'W' :
                    match.score_away < match.score_home ? 'L' : 'D';
          }
          formString = FIFACalculator.updateRecentForm(formString, result);
        });

        const stats = FIFACalculator.calculateFormStats(formString);

        // Update form
        await connection.query(
          `INSERT INTO recent_forms 
           (country_id, last_10_matches, wins, draws, losses, win_percentage)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             last_10_matches = VALUES(last_10_matches),
             wins = VALUES(wins),
             draws = VALUES(draws),
             losses = VALUES(losses),
             win_percentage = VALUES(win_percentage)`,
          [country.id, formString, stats.wins, stats.draws, stats.losses, stats.winPercentage]
        );
      }

      await connection.commit();
      return { success: true, message: 'All forms recalculated successfully' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = RecentForm;