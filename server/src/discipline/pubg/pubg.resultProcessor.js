// PUBG is N-way, not pairwise — every squad in the match gets a rank from
// placement, plus points from BOTH placement and kills. This is the actual
// proof that Match.outcome[] generalizes beyond 2-team win/loss.
const POINTS_PER_KILL = 1;
const PLACEMENT_POINTS = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };

function normalizePubgResult(rawResult, participants) {
  if (!rawResult || !Array.isArray(rawResult.squadResults) || rawResult.squadResults.length < 2) {
    throw new Error('PUBG result requires at least 2 squadResults');
  }

  return rawResult.squadResults
    .map((squad) => {
      const participant = participants.find((p) => p.teamId.toString() === squad.teamId);
      if (!participant) throw new Error(`Team ${squad.teamId} is not a participant in this match`);

      const placementPoints = PLACEMENT_POINTS[squad.placement] || 0;
      const killPoints = squad.kills * POINTS_PER_KILL;

      return {
        teamId: participant.teamId,
        rank: squad.placement,
        points: placementPoints + killPoints,
        displayStat: `#${squad.placement} · ${squad.kills} kills`
      };
    })
    .sort((a, b) => a.rank - b.rank);
}

module.exports = { normalizePubgResult };