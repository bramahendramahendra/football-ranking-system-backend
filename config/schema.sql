-- ============================================
-- Football Ranking System - Database Schema
-- ============================================

USE football_ranking_db;

-- Drop tables if exists (untuk development)
DROP TABLE IF EXISTS ranking_history;
DROP TABLE IF EXISTS player_stats;
DROP TABLE IF EXISTS match_events;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS competition_participants;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS recent_forms;
DROP TABLE IF EXISTS countries;

-- ============================================
-- Table: countries
-- Menyimpan data negara/tim nasional
-- ============================================
CREATE TABLE countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE COMMENT 'ISO 3166-1 alpha-3 code',
    confederation ENUM('UEFA', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC') NOT NULL,
    flag_url VARCHAR(255),
    fifa_points DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    world_ranking INT DEFAULT 999,
    confederation_ranking INT DEFAULT 999,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_confederation (confederation),
    INDEX idx_fifa_points (fifa_points DESC),
    INDEX idx_world_ranking (world_ranking),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: competitions
-- Menyimpan data kompetisi/turnamen
-- ============================================
CREATE TABLE competitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    year INT NOT NULL,
    type ENUM('world', 'continental') NOT NULL,
    confederation ENUM('FIFA', 'UEFA', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC'),
    format ENUM('group', 'knockout', 'league', 'group_knockout') DEFAULT 'group',
    host_country_id INT,
    match_importance_factor DECIMAL(3, 1) DEFAULT 1.0 COMMENT 'FIFA match importance: 1.0-4.0',
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (host_country_id) REFERENCES countries(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_year (year DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: competition_participants
-- Menyimpan peserta kompetisi dan group mereka
-- ============================================
CREATE TABLE competition_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    country_id INT NOT NULL,
    group_name VARCHAR(10) COMMENT 'Group A, B, C, etc. NULL untuk knockout',
    position INT COMMENT 'Final position in competition',
    points INT DEFAULT 0 COMMENT 'Points in group/league stage',
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    drawn INT DEFAULT 0,
    lost INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    goal_difference INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (competition_id, country_id),
    INDEX idx_group (competition_id, group_name),
    INDEX idx_points (points DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: matches
-- Menyimpan data pertandingan
-- ============================================
CREATE TABLE matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT,
    country_home_id INT NOT NULL,
    country_away_id INT NOT NULL,
    score_home INT,
    score_away INT,
    penalties_home INT COMMENT 'Penalty shootout score',
    penalties_away INT,
    match_date DATETIME NOT NULL,
    match_stage VARCHAR(50) COMMENT 'Group Stage, Quarter Final, etc.',
    is_neutral_venue BOOLEAN DEFAULT FALSE,
    venue VARCHAR(200),
    attendance INT,
    status ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled') DEFAULT 'scheduled',
    match_importance_factor DECIMAL(3, 1) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL,
    FOREIGN KEY (country_home_id) REFERENCES countries(id) ON DELETE CASCADE,
    FOREIGN KEY (country_away_id) REFERENCES countries(id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id),
    INDEX idx_date (match_date DESC),
    INDEX idx_status (status),
    INDEX idx_teams (country_home_id, country_away_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: match_events
-- Menyimpan event dalam pertandingan (goals, cards, etc.)
-- ============================================
CREATE TABLE match_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    country_id INT NOT NULL,
    player_name VARCHAR(100),
    event_type ENUM('goal', 'own_goal', 'penalty_goal', 'yellow_card', 'red_card', 'substitution') NOT NULL,
    minute INT NOT NULL,
    additional_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    INDEX idx_match (match_id),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: player_stats
-- Menyimpan statistik pemain per kompetisi
-- ============================================
CREATE TABLE player_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    country_id INT NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    clean_sheets INT DEFAULT 0 COMMENT 'For goalkeepers',
    yellow_cards INT DEFAULT 0,
    red_cards INT DEFAULT 0,
    matches_played INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_competition (competition_id, country_id, player_name),
    INDEX idx_goals (goals DESC),
    INDEX idx_assists (assists DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: recent_forms
-- Menyimpan form 10 pertandingan terakhir
-- ============================================
CREATE TABLE recent_forms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    country_id INT NOT NULL UNIQUE,
    last_10_matches VARCHAR(10) COMMENT 'Format: WWDLWWDLWL (W=Win, D=Draw, L=Loss)',
    wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_percentage DECIMAL(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: ranking_history
-- Menyimpan history perubahan ranking
-- ============================================
CREATE TABLE ranking_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    country_id INT NOT NULL,
    world_ranking INT NOT NULL,
    confederation_ranking INT NOT NULL,
    fifa_points DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    INDEX idx_country_date (country_id, recorded_at DESC),
    INDEX idx_recorded_at (recorded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Triggers untuk auto-update ranking history
-- ============================================
DELIMITER //

CREATE TRIGGER after_country_update_ranking
AFTER UPDATE ON countries
FOR EACH ROW
BEGIN
    -- Hanya simpan jika fifa_points atau ranking berubah
    IF OLD.fifa_points != NEW.fifa_points 
       OR OLD.world_ranking != NEW.world_ranking 
       OR OLD.confederation_ranking != NEW.confederation_ranking THEN
        
        INSERT INTO ranking_history (
            country_id, 
            world_ranking, 
            confederation_ranking, 
            fifa_points
        ) VALUES (
            NEW.id,
            NEW.world_ranking,
            NEW.confederation_ranking,
            NEW.fifa_points
        );
    END IF;
END//

DELIMITER ;

-- ============================================
-- Initial Data: Insert dummy countries
-- ============================================

-- UEFA Countries
INSERT INTO countries (name, code, confederation, fifa_points, flag_url) VALUES
('France', 'FRA', 'UEFA', 1840.93, 'https://flagcdn.com/w320/fr.png'),
('England', 'ENG', 'UEFA', 1800.05, 'https://flagcdn.com/w320/gb-eng.png'),
('Spain', 'ESP', 'UEFA', 1788.50, 'https://flagcdn.com/w320/es.png'),
('Germany', 'GER', 'UEFA', 1754.18, 'https://flagcdn.com/w320/de.png'),
('Italy', 'ITA', 'UEFA', 1729.40, 'https://flagcdn.com/w320/it.png'),
('Netherlands', 'NED', 'UEFA', 1694.00, 'https://flagcdn.com/w320/nl.png'),
('Portugal', 'POR', 'UEFA', 1677.15, 'https://flagcdn.com/w320/pt.png'),
('Belgium', 'BEL', 'UEFA', 1665.22, 'https://flagcdn.com/w320/be.png');

-- CONMEBOL Countries
INSERT INTO countries (name, code, confederation, fifa_points, flag_url) VALUES
('Argentina', 'ARG', 'CONMEBOL', 1860.14, 'https://flagcdn.com/w320/ar.png'),
('Brazil', 'BRA', 'CONMEBOL', 1837.56, 'https://flagcdn.com/w320/br.png'),
('Uruguay', 'URU', 'CONMEBOL', 1638.50, 'https://flagcdn.com/w320/uy.png'),
('Colombia', 'COL', 'CONMEBOL', 1620.30, 'https://flagcdn.com/w320/co.png');

-- AFC Countries
INSERT INTO countries (name, code, confederation, fifa_points, flag_url) VALUES
('Japan', 'JPN', 'AFC', 1632.95, 'https://flagcdn.com/w320/jp.png'),
('South Korea', 'KOR', 'AFC', 1615.77, 'https://flagcdn.com/w320/kr.png'),
('Iran', 'IRN', 'AFC', 1580.00, 'https://flagcdn.com/w320/ir.png'),
('Australia', 'AUS', 'AFC', 1560.45, 'https://flagcdn.com/w320/au.png');

-- CAF Countries
INSERT INTO countries (name, code, confederation, fifa_points, flag_url) VALUES
('Morocco', 'MAR', 'CAF', 1658.49, 'https://flagcdn.com/w320/ma.png'),
('Senegal', 'SEN', 'CAF', 1620.00, 'https://flagcdn.com/w320/sn.png'),
('Nigeria', 'NGA', 'CAF', 1575.00, 'https://flagcdn.com/w320/ng.png'),
('Egypt', 'EGY', 'CAF', 1545.00, 'https://flagcdn.com/w320/eg.png');

-- CONCACAF Countries
INSERT INTO countries (name, code, confederation, fifa_points, flag_url) VALUES
('Mexico', 'MEX', 'CONCACAF', 1650.00, 'https://flagcdn.com/w320/mx.png'),
('USA', 'USA', 'CONCACAF', 1635.00, 'https://flagcdn.com/w320/us.png'),
('Canada', 'CAN', 'CONCACAF', 1590.00, 'https://flagcdn.com/w320/ca.png');

-- OFC Country
INSERT INTO countries (name, code, confederation, fifa_points, flag_url) VALUES
('New Zealand', 'NZL', 'OFC', 1480.00, 'https://flagcdn.com/w320/nz.png');

-- ============================================
-- Stored Procedures
-- ============================================

-- Procedure untuk update ranking dunia
DELIMITER //

CREATE PROCEDURE UpdateWorldRankings()
BEGIN
    SET @rank := 0;
    
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.world_ranking = ranked.new_rank;
END//

-- Procedure untuk update ranking per confederation
CREATE PROCEDURE UpdateConfederationRankings()
BEGIN
    -- UEFA
    SET @rank := 0;
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE AND confederation = 'UEFA'
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.confederation_ranking = ranked.new_rank;
    
    -- AFC
    SET @rank := 0;
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE AND confederation = 'AFC'
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.confederation_ranking = ranked.new_rank;
    
    -- CAF
    SET @rank := 0;
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE AND confederation = 'CAF'
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.confederation_ranking = ranked.new_rank;
    
    -- CONCACAF
    SET @rank := 0;
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE AND confederation = 'CONCACAF'
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.confederation_ranking = ranked.new_rank;
    
    -- CONMEBOL
    SET @rank := 0;
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE AND confederation = 'CONMEBOL'
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.confederation_ranking = ranked.new_rank;
    
    -- OFC
    SET @rank := 0;
    UPDATE countries c
    JOIN (
        SELECT id, (@rank := @rank + 1) as new_rank
        FROM countries
        WHERE is_active = TRUE AND confederation = 'OFC'
        ORDER BY fifa_points DESC, name ASC
    ) ranked ON c.id = ranked.id
    SET c.confederation_ranking = ranked.new_rank;
END//

DELIMITER ;

-- Jalankan initial ranking update
CALL UpdateWorldRankings();
CALL UpdateConfederationRankings();

-- Initialize recent_forms untuk semua negara
INSERT INTO recent_forms (country_id, last_10_matches, wins, draws, losses, win_percentage)
SELECT id, '', 0, 0, 0, 0.00
FROM countries;

-- ============================================
-- Views untuk query yang sering digunakan
-- ============================================

CREATE VIEW v_world_rankings AS
SELECT 
    c.id,
    c.name,
    c.code,
    c.confederation,
    c.flag_url,
    c.fifa_points,
    c.world_ranking,
    c.confederation_ranking,
    rf.last_10_matches,
    rf.wins as recent_wins,
    rf.draws as recent_draws,
    rf.losses as recent_losses,
    rf.win_percentage,
    c.updated_at
FROM countries c
LEFT JOIN recent_forms rf ON c.id = rf.country_id
WHERE c.is_active = TRUE
ORDER BY c.world_ranking ASC;

-- ============================================
-- Indexes untuk optimasi query
-- ============================================

-- Composite indexes untuk query yang kompleks
CREATE INDEX idx_matches_competition_date ON matches(competition_id, match_date DESC);
CREATE INDEX idx_participants_comp_group ON competition_participants(competition_id, group_name, points DESC);

-- Full-text search index untuk pencarian negara
ALTER TABLE countries ADD FULLTEXT INDEX ft_name (name);

-- ============================================
-- Selesai
-- ============================================

SELECT '✅ Database schema created successfully!' as message;
SELECT COUNT(*) as total_countries FROM countries;