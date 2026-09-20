// Normalizes a football raw result into the generic outcome[] shape.
// Pairwise, like cricket — goals decide the winner. Standard soccer scoring:
// win = 3, draw = 1, loss = 0. Note this is DIFFERENT from cricket's 2/1/0 —
// that's fine, because standings are now derived from rank, not from magic
// point values (see the match.controller.js fix alongside this file).
const WIN_POINTS = 3;
const TIE_POINTS = 1;
const LOSS_POINTS = 0;

function normalizeFootballResult(rawResult, participants) {
  if (!rawResult || !Array.isArray(rawResult.matchScores) || rawResult.matchScores.length !== 2) {
    throw new Error('Football result requires exactly 2 matchScores');
  }

  const scores = participants.map((p) => {
    const score = rawResult.matchScores.find((s) => s.teamId === p.teamId.toString());
    if (!score) throw new Error(`No score found for team ${p.teamId}`);
    return {
      teamId: p.teamId,
      goals: score.goals,
      displayStat: `${score.goals} goals`
    };
  });

  const [a, b] = scores;

  if (a.goals === b.goals) {
    return [
      { teamId: a.teamId, rank: 1, points: TIE_POINTS, displayStat: a.displayStat },
      { teamId: b.teamId, rank: 1, points: TIE_POINTS, displayStat: b.displayStat }
    ];
  }

  const [winner, loser] = a.goals > b.goals ? [a, b] : [b, a];
  return [
    { teamId: winner.teamId, rank: 1, points: WIN_POINTS, displayStat: winner.displayStat },
    { teamId: loser.teamId, rank: 2, points: LOSS_POINTS, displayStat: loser.displayStat }
  ];
}

module.exports = { normalizeFootballResult };