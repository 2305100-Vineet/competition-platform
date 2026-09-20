const mongoose = require('mongoose');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const disciplineRegistry = require('../discipline/registry');

exports.createMatch = async (req, res) => {
  try {
    const { tournamentId, format, teamIds, scheduledAt } = req.body;
    if (!tournamentId || !format || !teamIds || !Array.isArray(teamIds) || teamIds.length < 2) {
      return res.status(400).json({ message: 'tournamentId, format, and at least 2 teamIds are required' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can create matches' });
    }

    const participants = teamIds.map((teamId) => {
      const participant = tournament.participants.find((p) => p.teamId.toString() === teamId);
      if (!participant) throw new Error(`Team ${teamId} is not an approved participant in this tournament`);
      return {
        teamId: participant.teamId,
        teamNameSnapshot: participant.teamNameSnapshot,
        rosterSnapshot: participant.rosterSnapshot,
        seed: participant.seed
      };
    });

    const match = await Match.create({
      tournamentId,
      discipline: tournament.discipline,
      format,
      participants,
      scheduledAt
    });

    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.generateRoundRobinFixtures = async (req, res) => {
  try {
    const { tournamentId } = req.body;
    if (!tournamentId) return res.status(400).json({ message: 'tournamentId is required' });

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can generate fixtures' });
    }

    if (tournament.participants.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 approved participants to generate fixtures' });
    }

    const existing = await Match.findOne({ tournamentId, format: 'round_robin' });
    if (existing) {
      return res.status(409).json({ message: 'Round robin fixtures already generated for this tournament' });
    }

    let teams = tournament.participants.map((p) => ({
      teamId: p.teamId,
      teamNameSnapshot: p.teamNameSnapshot,
      rosterSnapshot: p.rosterSnapshot,
      seed: p.seed
    }));
    if (teams.length % 2 !== 0) teams.push(null);

    const totalRounds = teams.length - 1;
    const half = teams.length / 2;
    const matchesToCreate = [];

    for (let round = 0; round < totalRounds; round++) {
      for (let i = 0; i < half; i++) {
        const teamA = teams[i];
        const teamB = teams[teams.length - 1 - i];
        if (teamA && teamB) {
          matchesToCreate.push({
            tournamentId,
            discipline: tournament.discipline,
            format: 'round_robin',
            round: round + 1,
            participants: [teamA, teamB]
          });
        }
      }
      teams.splice(1, 0, teams.pop());
    }

    const created = await Match.insertMany(matchesToCreate);
    res.status(201).json({ roundsGenerated: totalRounds, matchesCreated: created.length, matches: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Standard recursive tournament seeding order for a bracket of the given size
// (a power of two). e.g. size 8 -> [1,8,4,5,2,7,3,6], pairing (1v8, 4v5, 2v7, 3v6):
// top seeds are split into opposite halves of the draw and meet only in later rounds.
function buildSeedOrder(size) {
  if (size === 1) return [1];
  const prev = buildSeedOrder(size / 2);
  const result = [];
  prev.forEach((s) => {
    result.push(s);
    result.push(size + 1 - s);
  });
  return result;
}

// Single elimination bracket generation with proper seeding and bye support for
// any participant count >= 2 (previously required an exact power of two).
// Byes are assigned to the weakest seeds and always resolve in round 1 only —
// guaranteed by the seeding math, so no match ever ends up with two byes.
exports.generateSingleEliminationBracket = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { tournamentId } = req.body;
    if (!tournamentId) return res.status(400).json({ message: 'tournamentId is required' });

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can generate a bracket' });
    }

    const N = tournament.participants.length;
    if (N < 2) {
      return res.status(400).json({ message: 'Need at least 2 participants to generate a bracket' });
    }

    const existing = await Match.findOne({ tournamentId, format: 'single_elimination' });
    if (existing) {
      return res.status(409).json({ message: 'Bracket already generated for this tournament' });
    }

    // Seed by participant.seed if every participant has one; otherwise fall
    // back to registration order (no reordering).
    const hasExplicitSeeds = tournament.participants.every((p) => typeof p.seed === 'number');
    const ordered = [...tournament.participants].sort((a, b) => (hasExplicitSeeds ? a.seed - b.seed : 0));

    const bracketSize = Math.pow(2, Math.ceil(Math.log2(N)));
    const totalRounds = Math.log2(bracketSize);
    const seedOrder = buildSeedOrder(bracketSize);

    // slots[i] = the participant occupying seed position seedOrder[i], or null (bye)
    const slots = seedOrder.map((seed) => (seed <= N ? ordered[seed - 1] : null));

    const toSnapshot = (p) => ({
      teamId: p.teamId,
      teamNameSnapshot: p.teamNameSnapshot,
      rosterSnapshot: p.rosterSnapshot,
      seed: p.seed
    });

    const roundLabel = (round) => {
      if (round === totalRounds) return 'Final';
      if (round === totalRounds - 1) return 'Semifinal';
      if (round === totalRounds - 2) return 'Quarterfinal';
      return `Round ${round}`;
    };

    session.startTransaction();

    // Build backward from the Final so each match's nextMatchId already exists.
    let previousRoundMatches = null;
    const allCreated = [];
    const byeMatches = [];

    for (let round = totalRounds; round >= 1; round--) {
      const matchCount = Math.pow(2, totalRounds - round);
      const roundMatches = [];
      for (let i = 0; i < matchCount; i++) {
        const nextMatch = previousRoundMatches ? previousRoundMatches[Math.floor(i / 2)] : null;

        let participants = [];
        if (round === 1) {
          participants = [slots[i * 2], slots[i * 2 + 1]].filter(Boolean).map(toSnapshot);
        }

        const [doc] = await Match.create([{
          tournamentId,
          discipline: tournament.discipline,
          format: 'single_elimination',
          round,
          roundLabel: roundLabel(round),
          participants,
          nextMatchId: nextMatch ? nextMatch._id : null
        }], { session });

        if (round === 1 && participants.length === 1) byeMatches.push(doc);

        roundMatches.push(doc);
        allCreated.push(doc);
      }
      previousRoundMatches = roundMatches;
    }

    // Auto-resolve byes: the lone participant advances without playing.
    for (const byeMatch of byeMatches) {
      const winner = byeMatch.participants[0];
      byeMatch.status = 'Completed';
      byeMatch.meta = { isBye: true };
      byeMatch.outcome = [{ teamId: winner.teamId, rank: 1, points: 1, displayStat: 'Bye — advanced' }];
      await byeMatch.save({ session });

      if (byeMatch.nextMatchId) {
        const nextMatch = allCreated.find((m) => m._id.equals(byeMatch.nextMatchId));
        nextMatch.participants.push(winner);
        await nextMatch.save({ session });
      } else {
        tournament.status = 'Completed';
        await tournament.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      totalRounds,
      bracketSize,
      byes: byeMatches.length,
      matchesCreated: allCreated.length,
      matches: allCreated
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    res.status(500).json({ message: err.message });
  }
};

exports.getMatchesForTournament = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    if (!tournamentId) return res.status(400).json({ message: 'tournamentId query param is required' });
    const matches = await Match.find({ tournamentId }).sort({ round: 1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Win/tie/loss is derived from rank — how many teams share rank 1 in the
// match's outcome — instead of checking for a specific points value. Cricket
// uses 2/1/0 scoring, football uses 3/1/0; both work correctly because this
// no longer assumes any particular point scheme (this is the fix that makes
// the engine genuinely discipline-agnostic instead of secretly cricket-shaped).
function buildRoundRobinTable(matches) {
  const table = {};
  matches.forEach((match) => {
    const winnersCount = match.outcome.filter((e) => e.rank === 1).length;
    match.outcome.forEach((entry) => {
      const key = entry.teamId.toString();
      if (!table[key]) {
        const participant = match.participants.find((p) => p.teamId.toString() === key);
        table[key] = {
          teamId: entry.teamId,
          teamNameSnapshot: participant ? participant.teamNameSnapshot : null,
          played: 0, won: 0, lost: 0, tied: 0, points: 0
        };
      }
      table[key].played += 1;
      table[key].points += entry.points;
      if (winnersCount > 1) {
        table[key].tied += 1;
      } else if (entry.rank === 1) {
        table[key].won += 1;
      } else {
        table[key].lost += 1;
      }
    });
  });
  return Object.values(table).sort((a, b) => b.points - a.points);
}

function buildPointsLeagueTable(matches) {
  const table = {};
  matches.forEach((match) => {
    match.outcome.forEach((entry) => {
      const key = entry.teamId.toString();
      if (!table[key]) {
        const participant = match.participants.find((p) => p.teamId.toString() === key);
        table[key] = {
          teamId: entry.teamId,
          teamNameSnapshot: participant ? participant.teamNameSnapshot : null,
          matchesPlayed: 0,
          totalPoints: 0,
          bestPlacement: entry.rank
        };
      }
      table[key].matchesPlayed += 1;
      table[key].totalPoints += entry.points;
      table[key].bestPlacement = Math.min(table[key].bestPlacement, entry.rank);
    });
  });
  return Object.values(table).sort((a, b) => b.totalPoints - a.totalPoints);
}

async function recomputeStandings(tournamentId, format, session) {
  const matches = await Match.find({ tournamentId, format, status: 'Completed' }).session(session);
  if (format === 'round_robin') return buildRoundRobinTable(matches);
  if (format === 'points_league') return buildPointsLeagueTable(matches);
  return [];
}

exports.submitResult = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { rawResult } = req.body;
    if (!rawResult) return res.status(400).json({ message: 'rawResult is required' });

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const tournament = await Tournament.findById(match.tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can submit results' });
    }

    if (match.status !== 'Scheduled') {
      return res.status(400).json({ message: `Match is already ${match.status}. Use the correction endpoint to edit it.` });
    }

    const disciplineModule = disciplineRegistry[match.discipline];
    if (!disciplineModule) {
      return res.status(400).json({ message: `No result processor registered for discipline ${match.discipline}` });
    }

    const outcome = disciplineModule.normalizeResult(rawResult, match.participants);

    session.startTransaction();

    match.rawResult = rawResult;
    match.outcome = outcome;
    match.status = 'Completed';
    match.resultVersion += 1;
    await match.save({ session });

    if (match.format === 'round_robin' || match.format === 'points_league') {
      tournament.standings = await recomputeStandings(match.tournamentId, match.format, session);
    }

    if (match.format === 'single_elimination') {
      const winnerEntry = outcome.find((o) => o.rank === 1);
      const winnerParticipant = match.participants.find((p) => p.teamId.toString() === winnerEntry.teamId.toString());

      if (match.nextMatchId) {
        const nextMatch = await Match.findById(match.nextMatchId).session(session);
        nextMatch.participants.push({
          teamId: winnerParticipant.teamId,
          teamNameSnapshot: winnerParticipant.teamNameSnapshot,
          rosterSnapshot: winnerParticipant.rosterSnapshot,
          seed: winnerParticipant.seed
        });
        await nextMatch.save({ session });
      } else {
        tournament.status = 'Completed';
      }
    }

    await tournament.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ match, tournament });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};

// Corrects an already-Completed match's result. For single_elimination matches,
// this is only allowed while the next match is still Scheduled — if the winner
// has already played their next match, the organizer must correct that match
// first. Deeper multi-round cascades are out of scope (documented limitation).
exports.correctResult = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { rawResult } = req.body;
    if (!rawResult) return res.status(400).json({ message: 'rawResult is required' });

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const tournament = await Tournament.findById(match.tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (tournament.organizerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the organizer can correct results' });
    }

    if (match.status !== 'Completed') {
      return res.status(400).json({ message: 'Only a completed match can be corrected — submit a result first' });
    }

    const disciplineModule = disciplineRegistry[match.discipline];
    if (!disciplineModule) {
      return res.status(400).json({ message: `No result processor registered for discipline ${match.discipline}` });
    }

    const previousOutcome = match.outcome;
    const newOutcome = disciplineModule.normalizeResult(rawResult, match.participants);

    session.startTransaction();

    if (match.format === 'single_elimination' && match.nextMatchId) {
      const nextMatch = await Match.findById(match.nextMatchId).session(session);

      if (nextMatch.status !== 'Scheduled') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: 'Cannot correct this result — the next match has already been completed. Correct that match first.'
        });
      }

      const previousWinner = previousOutcome.find((o) => o.rank === 1);
      const newWinner = newOutcome.find((o) => o.rank === 1);

      if (previousWinner.teamId.toString() !== newWinner.teamId.toString()) {
        const newWinnerParticipant = match.participants.find((p) => p.teamId.toString() === newWinner.teamId.toString());
        nextMatch.participants = nextMatch.participants.filter((p) => p.teamId.toString() !== previousWinner.teamId.toString());
        nextMatch.participants.push({
          teamId: newWinnerParticipant.teamId,
          teamNameSnapshot: newWinnerParticipant.teamNameSnapshot,
          rosterSnapshot: newWinnerParticipant.rosterSnapshot,
          seed: newWinnerParticipant.seed
        });
        await nextMatch.save({ session });
      }
    }

    match.rawResult = rawResult;
    match.outcome = newOutcome;
    match.resultVersion += 1;
    await match.save({ session });

    if (match.format === 'round_robin' || match.format === 'points_league') {
      tournament.standings = await recomputeStandings(match.tournamentId, match.format, session);
      await tournament.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ match, tournament });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};