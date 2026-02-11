/**
 * Country Model
 * Model untuk mengelola data negara/tim nasional
 */

const db = require('../../config/database');

class Country {
  /**
   * Get all countries
   * @param {Object} filters - {confederation, is_active, search}
   * @param {Object} pagination - {page, limit}
   * @param {string} sortBy - Field untuk sorting
   * @param {string} sortOrder - asc atau desc
   */
  static async getAll(filters = {}, pagination = {}, sortBy = 'world_ranking', sortOrder = 'ASC') {
    try {
      let query = `
        SELECT 
          c.*,
          rf.last_10_matches,
          rf.wins as recent_wins,
          rf.draws as recent_draws,
          rf.losses as recent_losses,
          rf.win_percentage
        FROM countries c
        LEFT JOIN recent_forms rf ON c.id = rf.country_id
        WHERE 1=1
      `;
      const queryParams = [];

      // Apply filters
      if (filters.confederation) {
        query += ' AND c.confederation = ?';
        queryParams.push(filters.confederation);
      }

      if (filters.is_active !== undefined) {
        query += ' AND c.is_active = ?';
        queryParams.push(filters.is_active);
      }

      if (filters.search) {
        query += ' AND (c.name LIKE ? OR c.code LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      // Count total for pagination
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countResult] = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Apply sorting
      const validSortFields = ['world_ranking', 'fifa_points', 'name', 'confederation_ranking'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'world_ranking';
      const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY c.${sortField} ${order}`;

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
   * Get country by ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          rf.last_10_matches,
          rf.wins as recent_wins,
          rf.draws as recent_draws,
          rf.losses as recent_losses,
          rf.win_percentage
        FROM countries c
        LEFT JOIN recent_forms rf ON c.id = rf.country_id
        WHERE c.id = ?
      `;
      
      const [rows] = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get country by code
   */
  static async getByCode(code) {
    try {
      const query = `
        SELECT c.*, rf.last_10_matches, rf.win_percentage
        FROM countries c
        LEFT JOIN recent_forms rf ON c.id = rf.country_id
        WHERE c.code = ?
      `;
      
      const [rows] = await db.query(query, [code]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new country
   */
  static async create(countryData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate code dari nama jika tidak ada
      if (!countryData.code) {
        countryData.code = countryData.name.substring(0, 3).toUpperCase();
      }

      const query = `
        INSERT INTO countries (name, code, confederation, flag_url, fifa_points)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.query(query, [
        countryData.name,
        countryData.code,
        countryData.confederation,
        countryData.flag_url || null,
        countryData.fifa_points || 0
      ]);

      // Initialize recent form
      await connection.query(
        'INSERT INTO recent_forms (country_id, last_10_matches) VALUES (?, ?)',
        [result.insertId, '']
      );

      // Update rankings
      await connection.query('CALL UpdateWorldRankings()');
      await connection.query('CALL UpdateConfederationRankings()');

      await connection.commit();

      return await this.getById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update country
   */
  static async update(id, countryData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const fields = [];
      const values = [];

      if (countryData.name !== undefined) {
        fields.push('name = ?');
        values.push(countryData.name);
      }
      if (countryData.code !== undefined) {
        fields.push('code = ?');
        values.push(countryData.code);
      }
      if (countryData.confederation !== undefined) {
        fields.push('confederation = ?');
        values.push(countryData.confederation);
      }
      if (countryData.flag_url !== undefined) {
        fields.push('flag_url = ?');
        values.push(countryData.flag_url);
      }
      if (countryData.fifa_points !== undefined) {
        fields.push('fifa_points = ?');
        values.push(countryData.fifa_points);
      }
      if (countryData.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(countryData.is_active);
      }

      if (fields.length === 0) {
        return await this.getById(id);
      }

      values.push(id);
      const query = `UPDATE countries SET ${fields.join(', ')} WHERE id = ?`;
      
      await connection.query(query, values);

      // Update rankings jika fifa_points berubah
      if (countryData.fifa_points !== undefined || countryData.confederation !== undefined) {
        await connection.query('CALL UpdateWorldRankings()');
        await connection.query('CALL UpdateConfederationRankings()');
      }

      await connection.commit();

      return await this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Soft delete country
   */
  static async delete(id) {
    try {
      // Check if country is in active competitions
      const [activeComps] = await db.query(`
        SELECT COUNT(*) as count
        FROM competition_participants cp
        JOIN competitions c ON cp.competition_id = c.id
        WHERE cp.country_id = ? AND c.status IN ('upcoming', 'ongoing')
      `, [id]);

      if (activeComps[0].count > 0) {
        throw new Error('Cannot delete country that is participating in active competitions');
      }

      const query = 'UPDATE countries SET is_active = FALSE WHERE id = ?';
      const [result] = await db.query(query, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hard delete country (permanent)
   */
  static async hardDelete(id) {
    try {
      const query = 'DELETE FROM countries WHERE id = ?';
      const [result] = await db.query(query, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get ranking history for a country
   */
  static async getRankingHistory(id, limit = 10) {
    try {
      const query = `
        SELECT *
        FROM ranking_history
        WHERE country_id = ?
        ORDER BY recorded_at DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [id, limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get confederation statistics
   */
  static async getConfederationStats(confederation) {
    try {
      const query = `
        SELECT 
          confederation,
          COUNT(*) as total_countries,
          AVG(fifa_points) as avg_points,
          MAX(fifa_points) as max_points,
          MIN(fifa_points) as min_points
        FROM countries
        WHERE confederation = ? AND is_active = TRUE
        GROUP BY confederation
      `;
      
      const [rows] = await db.query(query, [confederation]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update FIFA points
   */
  static async updateFIFAPoints(id, pointsChange) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const query = `
        UPDATE countries 
        SET fifa_points = fifa_points + ?
        WHERE id = ?
      `;
      
      await connection.query(query, [pointsChange, id]);

      // Update rankings
      await connection.query('CALL UpdateWorldRankings()');
      await connection.query('CALL UpdateConfederationRankings()');

      await connection.commit();

      return await this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Country;