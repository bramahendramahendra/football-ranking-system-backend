# Testing Guide - Football Ranking API

Panduan lengkap untuk testing API.

## Prerequisites

- Server backend sudah running di `http://localhost:5000`
- Database sudah disetup dengan data dummy

## Testing dengan cURL

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Football Ranking API is running",
  "timestamp": "2024-02-11T10:30:00.000Z",
  "uptime": 123.456
}
```

### 2. Get All Countries
```bash
curl http://localhost:5000/api/countries
```

### 3. Get World Rankings
```bash
curl http://localhost:5000/api/countries/rankings/world?page=1&limit=10
```

### 4. Get Confederation Rankings (UEFA)
```bash
curl http://localhost:5000/api/countries/rankings/confederation/UEFA
```

### 5. Create New Country
```bash
curl -X POST http://localhost:5000/api/countries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Indonesia",
    "code": "IDN",
    "confederation": "AFC",
    "flag_url": "https://flagcdn.com/w320/id.png",
    "fifa_points": 1450.50
  }'
```

### 6. Update Country
```bash
curl -X PUT http://localhost:5000/api/countries/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fifa_points": 1850.93
  }'
```

### 7. Compare Two Countries
```bash
curl http://localhost:5000/api/countries/compare/1/2
```

### 8. Create Competition
```bash
curl -X POST http://localhost:5000/api/competitions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "World Cup 2026",
    "year": 2026,
    "type": "world",
    "confederation": "FIFA",
    "format": "group_knockout",
    "match_importance_factor": 4.0,
    "status": "upcoming",
    "start_date": "2026-06-11",
    "end_date": "2026-07-19"
  }'
```

### 9. Add Participants to Competition
```bash
curl -X POST http://localhost:5000/api/competitions/1/participants \
  -H "Content-Type: application/json" \
  -d '{
    "country_ids": [1, 2, 3, 4, 5, 6, 7, 8],
    "groups": {
      "1": "A",
      "2": "A",
      "3": "B",
      "4": "B",
      "5": "C",
      "6": "C",
      "7": "D",
      "8": "D"
    }
  }'
```

### 10. Get Competition Standings
```bash
curl http://localhost:5000/api/competitions/1/standings
```

### 11. Create Match
```bash
curl -X POST http://localhost:5000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "competition_id": 1,
    "country_home_id": 1,
    "country_away_id": 2,
    "match_date": "2026-06-12T20:00:00Z",
    "match_stage": "Group Stage",
    "venue": "MetLife Stadium",
    "is_neutral_venue": false
  }'
```

### 12. Simulate Match
```bash
curl -X POST http://localhost:5000/api/matches/1/simulate
```

### 13. Update Match Result Manually
```bash
curl -X PUT http://localhost:5000/api/matches/1/result \
  -H "Content-Type: application/json" \
  -d '{
    "score_home": 3,
    "score_away": 1
  }'
```

### 14. Get Head-to-Head
```bash
curl http://localhost:5000/api/matches/head-to-head/1/2?limit=5
```

### 15. Get Upcoming Matches
```bash
curl http://localhost:5000/api/matches/upcoming?limit=10
```

### 16. Get Recent Matches
```bash
curl http://localhost:5000/api/matches/recent?limit=10
```

## Testing Scenarios

### Scenario 1: Complete Competition Flow

1. Create competition
2. Add participants
3. Create matches between participants
4. Simulate all matches
5. View standings
6. View statistics

### Scenario 2: FIFA Points Update

1. Get country initial points
2. Create match
3. Update match result
4. Get country updated points
5. Verify ranking changed

### Scenario 3: Recent Form Tracking

1. Get country initial form
2. Simulate 5 matches for the country
3. Check form updated (WWLWD format)
4. Verify win percentage calculated

## Expected Behaviors

### When Creating Country
- ✅ FIFA points default to 0 if not specified
- ✅ World ranking and confederation ranking auto-calculated
- ✅ Recent form initialized empty
- ✅ Ranking history entry created

### When Simulating Match
- ✅ Score generated based on team strengths
- ✅ FIFA points updated for both teams
- ✅ Rankings recalculated
- ✅ Recent form updated
- ✅ Competition standings updated (if applicable)
- ✅ Ranking history recorded

### When Updating Match Result
- ✅ All updates same as simulation
- ✅ Old result overwritten if match already finished

## Common Errors & Solutions

### Error: Country not found
**Solution**: Check country ID exists in database

### Error: Match already finished
**Solution**: Cannot simulate finished match. Delete and create new one.

### Error: Standings not available for knockout format
**Solution**: Only group and league formats have standings

### Error: Duplicate entry
**Solution**: Country name or code already exists. Use different values.

## Performance Testing

### Load Test - Get Rankings
```bash
# Run 100 requests
for i in {1..100}; do
  curl http://localhost:5000/api/countries/rankings/world &
done
wait
```

### Stress Test - Simulate Multiple Matches
```bash
# Create and simulate 50 matches
for i in {1..50}; do
  # Create match (adjust IDs accordingly)
  curl -X POST http://localhost:5000/api/matches \
    -H "Content-Type: application/json" \
    -d "{\"country_home_id\": $((1 + RANDOM % 24)), \"country_away_id\": $((1 + RANDOM % 24)), \"match_date\": \"2024-12-01T15:00:00Z\"}"
  
  # Simulate match
  curl -X POST http://localhost:5000/api/matches/$i/simulate
done
```

## Validation Testing

### Test Invalid Data

1. **Invalid confederation**:
```bash
curl -X POST http://localhost:5000/api/countries \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "code": "TST", "confederation": "INVALID"}'
```
Expected: 400 error with validation message

2. **Missing required fields**:
```bash
curl -X POST http://localhost:5000/api/countries \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```
Expected: 400 error listing missing fields

3. **Invalid date format**:
```bash
curl -X POST http://localhost:5000/api/matches \
  -H "Content-Type: application/json" \
  -d '{"country_home_id": 1, "country_away_id": 2, "match_date": "invalid-date"}'
```
Expected: 400 error with date format message