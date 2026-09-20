const { normalizeCricketResult } = require('./cricket/cricket.resultProcessor');
const { normalizePubgResult } = require('./pubg/pubg.resultProcessor');
const { normalizeFootballResult } = require('./football/football.resultProcessor');

const registry = {
  cricket: { normalizeResult: normalizeCricketResult },
  pubg: { normalizeResult: normalizePubgResult },
  football: { normalizeResult: normalizeFootballResult }
};

module.exports = registry;