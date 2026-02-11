/**
 * FIFA Points Calculator & Match Simulator
 * Menghitung poin FIFA berdasarkan aturan resmi FIFA
 * dan simulasi hasil pertandingan
 */

class FIFACalculator {
  /**
   * Faktor penting pertandingan berdasarkan jenis kompetisi
   */
  static MATCH_IMPORTANCE = {
    friendly: 1.0,
    qualification: 2.5,
    continental: 3.0,
    world_cup: 4.0
  };

  /**
   * Hitung faktor kekuatan lawan
   * Formula: (200 - ranking_difference) / 100
   * Min: 0.5, Max: 2.0
   */
  static calculateOpponentStrength(homeRanking, awayRanking) {
    const rankingDiff = Math.abs(homeRanking - awayRanking);
    let factor = (200 - rankingDiff) / 100;
    
    // Clamp antara 0.5 dan 2.0
    factor = Math.max(0.5, Math.min(2.0, factor));
    
    return factor;
  }

  /**
   * Hitung faktor konfederasi
   * Sama konfederasi: 1.0
   * Beda konfederasi: 1.05
   */
  static calculateConfederationFactor(homeConfed, awayConfed) {
    return homeConfed === awayConfed ? 1.0 : 1.05;
  }

  /**
   * Hitung poin FIFA untuk satu tim
   * 
   * @param {string} result - 'win', 'draw', 'loss'
   * @param {number} matchImportance - Faktor penting pertandingan (1.0 - 4.0)
   * @param {number} opponentStrength - Kekuatan lawan (0.5 - 2.0)
   * @param {number} confederationFactor - Faktor konfederasi (1.0 atau 1.05)
   * @returns {number} Poin FIFA yang didapat
   */
  static calculateFIFAPoints(result, matchImportance, opponentStrength, confederationFactor) {
    let basePoints;
    
    switch(result) {
      case 'win':
        basePoints = 3;
        break;
      case 'draw':
        basePoints = 1;
        break;
      case 'loss':
        basePoints = 0;
        break;
      default:
        basePoints = 0;
    }

    const points = basePoints * matchImportance * opponentStrength * confederationFactor;
    
    return Math.round(points * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Hitung probabilitas kemenangan berdasarkan berbagai faktor
   * 
   * @param {Object} homeTeam - Data tim home
   * @param {Object} awayTeam - Data tim away
   * @param {boolean} isNeutralVenue - Apakah venue netral
   * @returns {Object} Probabilitas untuk home, draw, away
   */
  static calculateMatchProbability(homeTeam, awayTeam, isNeutralVenue = false) {
    // Bobot faktor
    const WEIGHTS = {
      fifaPoints: 0.40,
      homeAdvantage: 0.15,
      recentForm: 0.25,
      confederationRanking: 0.10,
      headToHead: 0.10
    };

    // 1. FIFA Points Factor (0-1)
    const totalPoints = homeTeam.fifa_points + awayTeam.fifa_points;
    const fifaFactor = totalPoints > 0 ? homeTeam.fifa_points / totalPoints : 0.5;

    // 2. Home Advantage Factor (0-1)
    const homeAdvantage = isNeutralVenue ? 0.5 : 0.65; // 65% jika ada home advantage

    // 3. Recent Form Factor (0-1)
    const homeFormPercent = homeTeam.win_percentage || 50;
    const awayFormPercent = awayTeam.win_percentage || 50;
    const totalFormPercent = homeFormPercent + awayFormPercent;
    const formFactor = totalFormPercent > 0 ? homeFormPercent / totalFormPercent : 0.5;

    // 4. Confederation Ranking Factor (0-1)
    const homeConfedRank = homeTeam.confederation_ranking || 50;
    const awayConfedRank = awayTeam.confederation_ranking || 50;
    // Ranking lebih rendah (angka lebih kecil) = lebih baik
    const totalRank = homeConfedRank + awayConfedRank;
    const confedFactor = totalRank > 0 ? awayConfedRank / totalRank : 0.5;

    // 5. Head to Head Factor (simplified - bisa dikembangkan)
    const h2hFactor = 0.5; // Default 50-50, bisa query dari database

    // Hitung weighted probability untuk home win
    const homeWinProb = (
      fifaFactor * WEIGHTS.fifaPoints +
      homeAdvantage * WEIGHTS.homeAdvantage +
      formFactor * WEIGHTS.recentForm +
      confedFactor * WEIGHTS.confederationRanking +
      h2hFactor * WEIGHTS.headToHead
    );

    // Distribusi probabilitas
    // Biasanya draw probability sekitar 25-30%
    const drawProb = 0.25 + (0.05 * (1 - Math.abs(homeWinProb - 0.5) * 2));
    const awayWinProb = 1 - homeWinProb - drawProb;

    return {
      home: Math.max(0, Math.min(1, homeWinProb)),
      draw: Math.max(0, Math.min(1, drawProb)),
      away: Math.max(0, Math.min(1, awayWinProb))
    };
  }

  /**
   * Simulasi skor pertandingan berdasarkan probabilitas
   * Menghasilkan skor realistis (0-0 hingga 5-3)
   * 
   * @param {Object} probability - {home, draw, away}
   * @returns {Object} {scoreHome, scoreAway, result}
   */
  static simulateMatchScore(probability) {
    const random = Math.random();
    let result;
    let scoreHome, scoreAway;

    // Tentukan pemenang berdasarkan probabilitas
    if (random < probability.home) {
      result = 'home_win';
    } else if (random < probability.home + probability.draw) {
      result = 'draw';
    } else {
      result = 'away_win';
    }

    // Generate skor berdasarkan hasil
    switch(result) {
      case 'home_win':
        scoreHome = this.generateGoals(probability.home, true);
        scoreAway = this.generateGoals(probability.away, false);
        // Pastikan home menang
        if (scoreHome <= scoreAway) {
          scoreHome = scoreAway + Math.floor(Math.random() * 2) + 1;
        }
        break;

      case 'draw':
        const drawScore = Math.floor(Math.random() * 4); // 0-3
        scoreHome = drawScore;
        scoreAway = drawScore;
        break;

      case 'away_win':
        scoreHome = this.generateGoals(probability.home, false);
        scoreAway = this.generateGoals(probability.away, true);
        // Pastikan away menang
        if (scoreAway <= scoreHome) {
          scoreAway = scoreHome + Math.floor(Math.random() * 2) + 1;
        }
        break;
    }

    return {
      scoreHome,
      scoreAway,
      result: scoreHome > scoreAway ? 'home_win' : 
              scoreHome < scoreAway ? 'away_win' : 'draw'
    };
  }

  /**
   * Generate jumlah gol berdasarkan probabilitas
   * @param {number} probability - Probabilitas menang (0-1)
   * @param {boolean} isWinner - Apakah tim ini pemenang
   * @returns {number} Jumlah gol
   */
  static generateGoals(probability, isWinner) {
    // Semakin tinggi probability, semakin besar peluang mencetak gol banyak
    const factor = isWinner ? probability * 1.5 : probability * 0.8;
    
    // Distribusi Poisson untuk generate gol (realistis)
    const lambda = factor * 3; // Expected goals (rata-rata 0-3)
    let goals = 0;
    let L = Math.exp(-lambda);
    let p = 1;
    let k = 0;

    do {
      k++;
      p *= Math.random();
      if (p > L) goals = k;
    } while (p > L && k < 6); // Max 6 goals

    return Math.min(goals, 5); // Cap at 5 goals
  }

  /**
   * Update poin FIFA untuk kedua tim setelah pertandingan
   * 
   * @param {Object} homeTeam - Data tim home
   * @param {Object} awayTeam - Data tim away  
   * @param {number} scoreHome - Skor tim home
   * @param {number} scoreAway - Skor tim away
   * @param {number} matchImportance - Faktor penting pertandingan
   * @param {boolean} isNeutralVenue - Apakah venue netral
   * @returns {Object} {homePoints, awayPoints, homeNewTotal, awayNewTotal}
   */
  static calculatePointsAfterMatch(homeTeam, awayTeam, scoreHome, scoreAway, matchImportance, isNeutralVenue = false) {
    // Tentukan hasil untuk masing-masing tim
    let homeResult, awayResult;
    if (scoreHome > scoreAway) {
      homeResult = 'win';
      awayResult = 'loss';
    } else if (scoreHome < scoreAway) {
      homeResult = 'loss';
      awayResult = 'win';
    } else {
      homeResult = 'draw';
      awayResult = 'draw';
    }

    // Hitung faktor kekuatan lawan
    const homeOpponentStrength = this.calculateOpponentStrength(
      homeTeam.world_ranking, 
      awayTeam.world_ranking
    );
    const awayOpponentStrength = this.calculateOpponentStrength(
      awayTeam.world_ranking, 
      homeTeam.world_ranking
    );

    // Hitung faktor konfederasi
    const confederationFactor = this.calculateConfederationFactor(
      homeTeam.confederation,
      awayTeam.confederation
    );

    // Hitung poin FIFA untuk masing-masing tim
    const homePoints = this.calculateFIFAPoints(
      homeResult,
      matchImportance,
      homeOpponentStrength,
      confederationFactor
    );

    const awayPoints = this.calculateFIFAPoints(
      awayResult,
      matchImportance,
      awayOpponentStrength,
      confederationFactor
    );

    return {
      homePointsGained: homePoints,
      awayPointsGained: awayPoints,
      homeNewTotal: parseFloat(homeTeam.fifa_points) + homePoints,
      awayNewTotal: parseFloat(awayTeam.fifa_points) + awayPoints
    };
  }

  /**
   * Update recent form string
   * Format: "WWDLWWDLWL" (W=Win, D=Draw, L=Loss)
   * Max 10 karakter (10 pertandingan terakhir)
   * 
   * @param {string} currentForm - Form saat ini
   * @param {string} result - Hasil pertandingan ('W', 'D', 'L')
   * @returns {string} Form yang sudah diupdate
   */
  static updateRecentForm(currentForm, result) {
    // Tambah hasil baru di depan
    let newForm = result.toUpperCase() + (currentForm || '');
    
    // Potong jika lebih dari 10
    if (newForm.length > 10) {
      newForm = newForm.substring(0, 10);
    }

    return newForm;
  }

  /**
   * Hitung statistik dari recent form string
   * 
   * @param {string} formString - String form "WWDLW"
   * @returns {Object} {wins, draws, losses, winPercentage}
   */
  static calculateFormStats(formString) {
    if (!formString || formString.length === 0) {
      return { wins: 0, draws: 0, losses: 0, winPercentage: 0 };
    }

    const wins = (formString.match(/W/g) || []).length;
    const draws = (formString.match(/D/g) || []).length;
    const losses = (formString.match(/L/g) || []).length;
    const total = formString.length;

    const winPercentage = total > 0 ? (wins / total) * 100 : 0;

    return {
      wins,
      draws,
      losses,
      winPercentage: Math.round(winPercentage * 100) / 100
    };
  }
}

module.exports = FIFACalculator;