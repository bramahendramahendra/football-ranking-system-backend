/**
 * Ranking History Model
 * Model untuk mengelola history perubahan ranking
 */

const db = require('../../config/database');

class RankingHistory {
  /**
   * Get ranking history for a country
   */
  static async getByCountryId(countryId, limit = 10) {
    try {
      const query = `
        SELECT *
        FROM ranking_history
        WHERE country_id = ?
        ORDER BY recorded_at DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [countryId, limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get ranking history with date range
   */
  static async getByDateRange(countryId, startDate, endDate) {
    try {
      const query = `
        SELECT *
        FROM ranking_history
        WHERE country_id = ?
          AND recorded_at BETWEEN ? AND ?
        ORDER BY recorded_at DESC
      `;
      
      const [rows] = await db.query(query, [countryId, startDate, endDate]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get latest ranking snapshot for all countries
   */
  static async getLatestSnapshot() {
    try {
      const query = `
        SELECT 
          rh.*,
          c.name as country_name,
          c.code as country_code,
          c.flag_url,
          c.confederation
        FROM ranking_history rh
        JOIN countries c ON rh.country_id = c.id
        WHERE rh.recorded_at = (
          SELECT MAX(recorded_at) 
          FROM ranking_history 
          WHERE country_id = rh.country_id
        )
        ORDER BY rh.world_ranking ASC
      `;
      
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare rankings between two dates
   */
  static async compareRankings(date1, date2) {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.code,
          c.flag_url,
          c.confederation,
          rh1.world_ranking as ranking_date1,
          rh1.fifa_points as points_date1,
          rh2.world_ranking as ranking_date2,
          rh2.fifa_points as points_date2,
          (rh1.world_ranking - rh2.world_ranking) as ranking_change,
          (rh2.fifa_points - rh1.fifa_points) as points_change
        FROM countries c
        LEFT JOIN (
          SELECT country_id, world_ranking, fifa_points
          FROM ranking_history
          WHERE DATE(recorded_at) = DATE(?)
          ORDER BY recorded_at DESC
          LIMIT 1
        ) rh1 ON c.id = rh1.country_id
        LEFT JOIN (
          SELECT country_id, world_ranking, fifa_points
          FROM ranking_history
          WHERE DATE(recorded_at) = DATE(?)
          ORDER BY recorded_at DESC
          LIMIT 1
        ) rh2 ON c.id = rh2.country_id
        WHERE rh1.country_id IS NOT NULL 
          OR rh2.country_id IS NOT NULL
        ORDER BY ranking_date2 ASC
      `;
      
      const [rows] = await db.query(query, [date1, date2]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get biggest movers (countries with largest ranking changes)
   */
  static async getBiggestMovers(period = 30, limit = 10) {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.code,
          c.flag_url,
          c.confederation,
          c.world_ranking as current_ranking,
          c.fifa_points as current_points,
          old.world_ranking as old_ranking,
          old.fifa_points as old_points,
          (old.world_ranking - c.world_ranking) as ranking_change,
          (c.fifa_points - old.fifa_points) as points_change
        FROM countries c
        JOIN (
          SELECT 
            country_id,
            world_ranking,
            fifa_points
          FROM ranking_history
          WHERE recorded_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY country_id
          HAVING MAX(recorded_at)
        ) old ON c.id = old.country_id
        WHERE c.is_active = TRUE
        ORDER BY ABS(old.world_ranking - c.world_ranking) DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [period, limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete old history (cleanup)
   */
  static async deleteOldHistory(daysToKeep = 365) {
    try {
      const query = `
        DELETE FROM ranking_history
        WHERE recorded_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const [result] = await db.query(query, [daysToKeep]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RankingHistory;