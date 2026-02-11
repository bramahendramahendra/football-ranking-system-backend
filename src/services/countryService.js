/**
 * Country Service
 * Business logic untuk operasi Country
 */

const Country = require('../models/Country');
const RankingHistory = require('../models/RankingHistory');

class CountryService {
  /**
   * Get all countries with filters and pagination
   */
  async getAllCountries(filters, pagination, sortBy, sortOrder) {
    try {
      const result = await Country.getAll(filters, pagination, sortBy, sortOrder);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get country by ID with ranking history
   */
  async getCountryById(id) {
    try {
      const country = await Country.getById(id);
      
      if (!country) {
        const error = new Error('Country not found');
        error.statusCode = 404;
        throw error;
      }

      // Get ranking history
      const history = await RankingHistory.getByCountryId(id, 10);

      return {
        ...country,
        ranking_history: history
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new country
   */
  async createCountry(countryData) {
    try {
      // Check if country name already exists
      const filters = { search: countryData.name };
      const existing = await Country.getAll(filters);
      
      if (existing.data.length > 0) {
        const error = new Error('Country with this name already exists');
        error.statusCode = 409;
        throw error;
      }

      const country = await Country.create(countryData);
      return country;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update country
   */
  async updateCountry(id, countryData) {
    try {
      const existingCountry = await Country.getById(id);
      
      if (!existingCountry) {
        const error = new Error('Country not found');
        error.statusCode = 404;
        throw error;
      }

      const updatedCountry = await Country.update(id, countryData);
      return updatedCountry;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete country (soft delete)
   */
  async deleteCountry(id) {
    try {
      const existingCountry = await Country.getById(id);
      
      if (!existingCountry) {
        const error = new Error('Country not found');
        error.statusCode = 404;
        throw error;
      }

      const result = await Country.delete(id);
      
      if (!result) {
        const error = new Error('Failed to delete country');
        error.statusCode = 500;
        throw error;
      }

      return { message: 'Country deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get world rankings
   */
  async getWorldRankings(filters, pagination) {
    try {
      const result = await Country.getAll(
        { ...filters, is_active: true },
        pagination,
        'world_ranking',
        'ASC'
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get confederation rankings
   */
  async getConfederationRankings(confederation, pagination) {
    try {
      const filters = { confederation, is_active: true };
      const result = await Country.getAll(
        filters,
        pagination,
        'confederation_ranking',
        'ASC'
      );

      // Get confederation stats
      const stats = await Country.getConfederationStats(confederation);

      return {
        ...result,
        confederation_stats: stats
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get ranking history for a country
   */
  async getRankingHistory(id, limit) {
    try {
      const country = await Country.getById(id);
      
      if (!country) {
        const error = new Error('Country not found');
        error.statusCode = 404;
        throw error;
      }

      const history = await RankingHistory.getByCountryId(id, limit);
      
      return {
        country: {
          id: country.id,
          name: country.name,
          code: country.code,
          flag_url: country.flag_url
        },
        history
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare two countries
   */
  async compareCountries(countryId1, countryId2) {
    try {
      const country1 = await Country.getById(countryId1);
      const country2 = await Country.getById(countryId2);

      if (!country1 || !country2) {
        const error = new Error('One or both countries not found');
        error.statusCode = 404;
        throw error;
      }

      // Calculate comparison metrics
      const comparison = {
        country1: {
          id: country1.id,
          name: country1.name,
          flag_url: country1.flag_url,
          fifa_points: country1.fifa_points,
          world_ranking: country1.world_ranking,
          confederation_ranking: country1.confederation_ranking,
          recent_form: country1.last_10_matches,
          win_percentage: country1.win_percentage
        },
        country2: {
          id: country2.id,
          name: country2.name,
          flag_url: country2.flag_url,
          fifa_points: country2.fifa_points,
          world_ranking: country2.world_ranking,
          confederation_ranking: country2.confederation_ranking,
          recent_form: country2.last_10_matches,
          win_percentage: country2.win_percentage
        },
        differences: {
          fifa_points_diff: country1.fifa_points - country2.fifa_points,
          world_ranking_diff: country1.world_ranking - country2.world_ranking,
          win_percentage_diff: country1.win_percentage - country2.win_percentage
        }
      };

      return comparison;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CountryService();