// Normalizes a cricket raw result into the generic outcome[] shape.
// This is the ONLY place that knows cricket-specific rules (runs decide the winner).
// Win/tie points are hardcoded here for now — once PUBG needs a genuinely different
// scoring shape, we'll extract this into a proper ScoringConfig collection.
const WIN_POINTS = 2;
const TIE_POINTS = 1;
const LOSS_POINTS = 0;

function normalizeCricketResult(rawResult, participants) {
  if (!rawResult || !Array.isArray(rawResult.innings) || rawResult.innings.length !== 2) {
    throw new Error('Cricket result requires exactly 2 innings');
  }

  const scores = participants.map((p) => {
    const inning = rawResult.innings.find((i) => i.battingTeamId === p.teamId.toString());
    if (!inning) throw new Error(`No innings found for team ${p.teamId}`);
    return {
      teamId: p.teamId,
      runs: inning.runs,
      wickets: inning.wickets,
      oversFaced: inning.oversFaced,
      displayStat: `${inning.runs}/${inning.wickets} (${inning.oversFaced} ov)`
    };
  });

  const [a, b] = scores;

  if (a.runs === b.runs) {
    return [
      { teamId: a.teamId, rank: 1, points: TIE_POINTS, displayStat: a.displayStat },
      { teamId: b.teamId, rank: 1, points: TIE_POINTS, displayStat: b.displayStat }
    ];
  }

  const [winner, loser] = a.runs > b.runs ? [a, b] : [b, a];
  return [
    { teamId: winner.teamId, rank: 1, points: WIN_POINTS, displayStat: winner.displayStat },
    { teamId: loser.teamId, rank: 2, points: LOSS_POINTS, displayStat: loser.displayStat }
  ];
}

module.exports = { normalizeCricketResult };