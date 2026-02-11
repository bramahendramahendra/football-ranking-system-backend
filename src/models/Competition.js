/**
 * Competition Model
 * Model untuk mengelola data kompetisi/turnamen
 */

const db = require('../../config/database');

class Competition {
  /**
   * Get all competitions
   * @param {Object} filters - {type, confederation, status, year}
   * @param {Object} pagination - {page, limit}
   */
  static async getAll(filters = {}, pagination = {}) {
    try {
      let query = `
        SELECT 
          c.*,
          co.name as host_country_name,
          co.flag_url as host_country_flag,
          (SELECT COUNT(*) FROM competition_participants WHERE competition_id = c.id) as total_participants
        FROM competitions c
        LEFT JOIN countries co ON c.host_country_id = co.id
        WHERE 1=1
      `;
      const queryParams = [];

      // Apply filters
      if (filters.type) {
        query += ' AND c.type = ?';
        queryParams.push(filters.type);
      }

      if (filters.confederation) {
        query += ' AND c.confederation = ?';
        queryParams.push(filters.confederation);
      }

      if (filters.status) {
        query += ' AND c.status = ?';
        queryParams.push(filters.status);
      }

      if (filters.year) {
        query += ' AND c.year = ?';
        queryParams.push(filters.year);
      }

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
      const [countResult] = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Apply sorting
      query += ' ORDER BY c.year DESC, c.created_at DESC';

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
   * Get competition by ID with full details
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          co.name as host_country_name,
          co.flag_url as host_country_flag,
          (SELECT COUNT(*) FROM competition_participants WHERE competition_id = c.id) as total_participants,
          (SELECT COUNT(*) FROM matches WHERE competition_id = c.id) as total_matches,
          (SELECT COUNT(*) FROM matches WHERE competition_id = c.id AND status = 'finished') as finished_matches
        FROM competitions c
        LEFT JOIN countries co ON c.host_country_id = co.id
        WHERE c.id = ?
      `;
      
      const [rows] = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new competition
   */
  static async create(competitionData) {
    try {
      // Set default match importance factor based on type
      if (!competitionData.match_importance_factor) {
        if (competitionData.type === 'world') {
          competitionData.match_importance_factor = 4.0; // World Cup
        } else {
          competitionData.match_importance_factor = 3.0; // Continental
        }
      }

      const query = `
        INSERT INTO competitions 
        (name, year, type, confederation, format, host_country_id, 
         match_importance_factor, status, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        competitionData.name,
        competitionData.year,
        competitionData.type,
        competitionData.confederation || null,
        competitionData.format || 'group',
        competitionData.host_country_id || null,
        competitionData.match_importance_factor,
        competitionData.status || 'upcoming',
        competitionData.start_date || null,
        competitionData.end_date || null
      ]);

      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update competition
   */
  static async update(id, competitionData) {
    try {
      const fields = [];
      const values = [];

      if (competitionData.name !== undefined) {
        fields.push('name = ?');
        values.push(competitionData.name);
      }
      if (competitionData.year !== undefined) {
        fields.push('year = ?');
        values.push(competitionData.year);
      }
      if (competitionData.type !== undefined) {
        fields.push('type = ?');
        values.push(competitionData.type);
      }
      if (competitionData.confederation !== undefined) {
        fields.push('confederation = ?');
        values.push(competitionData.confederation);
      }
      if (competitionData.format !== undefined) {
        fields.push('format = ?');
        values.push(competitionData.format);
      }
      if (competitionData.host_country_id !== undefined) {
        fields.push('host_country_id = ?');
        values.push(competitionData.host_country_id);
      }
      if (competitionData.match_importance_factor !== undefined) {
        fields.push('match_importance_factor = ?');
        values.push(competitionData.match_importance_factor);
      }
      if (competitionData.status !== undefined) {
        fields.push('status = ?');
        values.push(competitionData.status);
      }
      if (competitionData.start_date !== undefined) {
        fields.push('start_date = ?');
        values.push(competitionData.start_date);
      }
      if (competitionData.end_date !== undefined) {
        fields.push('end_date = ?');
        values.push(competitionData.end_date);
      }

      if (fields.length === 0) {
        return await this.getById(id);
      }

      values.push(id);
      const query = `UPDATE competitions SET ${fields.join(', ')} WHERE id = ?`;
      
      await db.query(query, values);

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete competition
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM competitions WHERE id = ?';
      const [result] = await db.query(query, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add participants to competition
   * @param {number} competitionId
   * @param {Array} countryIds - Array of country IDs
   * @param {Object} groups - Optional: {countryId: 'A', countryId2: 'B'}
   */
  static async addParticipants(competitionId, countryIds, groups = {}) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if competition exists
      const [comp] = await connection.query(
        'SELECT format FROM competitions WHERE id = ?',
        [competitionId]
      );

      if (comp.length === 0) {
        throw new Error('Competition not found');
      }

      const format = comp[0].format;

      // Insert participants
      for (const countryId of countryIds) {
        const groupName = groups[countryId] || null;
        
        await connection.query(
          `INSERT INTO competition_participants 
           (competition_id, country_id, group_name) 
           VALUES (?, ?, ?)`,
          [competitionId, countryId, groupName]
        );
      }

      await connection.commit();

      return await this.getParticipants(competitionId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Remove participant from competition
   */
  static async removeParticipant(competitionId, countryId) {
    try {
      const query = `
        DELETE FROM competition_participants 
        WHERE competition_id = ? AND country_id = ?
      `;
      
      const [result] = await db.query(query, [competitionId, countryId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all participants of a competition
   */
  static async getParticipants(competitionId, groupName = null) {
    try {
      let query = `
        SELECT 
          cp.*,
          c.name as country_name,
          c.code as country_code,
          c.flag_url,
          c.fifa_points,
          c.world_ranking,
          c.confederation
        FROM competition_participants cp
        JOIN countries c ON cp.country_id = c.id
        WHERE cp.competition_id = ?
      `;
      
      const params = [competitionId];

      if (groupName) {
        query += ' AND cp.group_name = ?';
        params.push(groupName);
      }

      query += ' ORDER BY cp.group_name ASC, cp.points DESC, cp.goal_difference DESC';

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get standings (for group/league format)
   */
  static async getStandings(competitionId) {
    try {
      const query = `
        SELECT 
          cp.*,
          c.name as country_name,
          c.code as country_code,
          c.flag_url
        FROM competition_participants cp
        JOIN countries c ON cp.country_id = c.id
        WHERE cp.competition_id = ?
        ORDER BY 
          cp.group_name ASC,
          cp.points DESC, 
          cp.goal_difference DESC, 
          cp.goals_for DESC,
          c.name ASC
      `;
      
      const [rows] = await db.query(query, [competitionId]);

      // Group by group_name
      const grouped = {};
      rows.forEach(row => {
        const group = row.group_name || 'Overall';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(row);
      });

      return grouped;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update participant stats after match
   */
  static async updateParticipantStats(competitionId, countryId, matchResult) {
    try {
      const query = `
        UPDATE competition_participants
        SET 
          played = played + 1,
          won = won + ?,
          drawn = drawn + ?,
          lost = lost + ?,
          goals_for = goals_for + ?,
          goals_against = goals_against + ?,
          goal_difference = goals_for - goals_against,
          points = points + ?
        WHERE competition_id = ? AND country_id = ?
      `;

      await db.query(query, [
        matchResult.won || 0,
        matchResult.drawn || 0,
        matchResult.lost || 0,
        matchResult.goals_for || 0,
        matchResult.goals_against || 0,
        matchResult.points || 0,
        competitionId,
        countryId
      ]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get top scorers in competition
   */
  static async getTopScorers(competitionId, limit = 10) {
    try {
      const query = `
        SELECT 
          ps.*,
          c.name as country_name,
          c.flag_url
        FROM player_stats ps
        JOIN countries c ON ps.country_id = c.id
        WHERE ps.competition_id = ?
        ORDER BY ps.goals DESC, ps.assists DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [competitionId, limit]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get competition statistics summary
   */
  static async getStatistics(competitionId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) as finished_matches,
          COALESCE(SUM(m.score_home + m.score_away), 0) as total_goals,
          COALESCE(AVG(m.score_home + m.score_away), 0) as avg_goals_per_match,
          COUNT(DISTINCT cp.country_id) as total_teams
        FROM competitions c
        LEFT JOIN matches m ON c.id = m.competition_id
        LEFT JOIN competition_participants cp ON c.id = cp.competition_id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [rows] = await db.query(query, [competitionId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get matches in competition
   */
  static async getMatches(competitionId, filters = {}) {
    try {
      let query = `
        SELECT 
          m.*,
          ch.name as home_name,
          ch.flag_url as home_flag,
          ca.name as away_name,
          ca.flag_url as away_flag
        FROM matches m
        JOIN countries ch ON m.country_home_id = ch.id
        JOIN countries ca ON m.country_away_id = ca.id
        WHERE m.competition_id = ?
      `;
      
      const params = [competitionId];

      if (filters.status) {
        query += ' AND m.status = ?';
        params.push(filters.status);
      }

      if (filters.match_stage) {
        query += ' AND m.match_stage = ?';
        params.push(filters.match_stage);
      }

      query += ' ORDER BY m.match_date DESC';

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Competition;