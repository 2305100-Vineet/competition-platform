import { useState } from 'react';
import apiClient from '../api/client';

export default function SubmitResultForm({ match, onSubmitted, mode = 'submit', initialRawResult = null }) {
  const [error, setError] = useState('');

  const [cricketInputs, setCricketInputs] = useState(() =>
    match.participants.map((p) => {
      const inning = initialRawResult?.innings?.find((i) => i.battingTeamId?.toString?.() === p.teamId?.toString?.());
      return inning
        ? { runs: String(inning.runs), wickets: String(inning.wickets), oversFaced: String(inning.oversFaced) }
        : { runs: '', wickets: '', oversFaced: '' };
    })
  );

  const [pubgInputs, setPubgInputs] = useState(() =>
    match.participants.map((p) => {
      const r = initialRawResult?.squadResults?.find((s) => s.teamId?.toString?.() === p.teamId?.toString?.());
      return r ? { placement: String(r.placement), kills: String(r.kills) } : { placement: '', kills: '' };
    })
  );

  const [footballInputs, setFootballInputs] = useState(() =>
    match.participants.map((p) => {
      const s = initialRawResult?.matchScores?.find((m) => m.teamId?.toString?.() === p.teamId?.toString?.());
      return s ? { goals: String(s.goals) } : { goals: '' };
    })
  );

  const postOrPatch = (payload) =>
    mode === 'correct'
      ? apiClient.patch(`/matches/${match._id}/result`, payload)
      : apiClient.post(`/matches/${match._id}/result`, payload);

  const submitCricket = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const innings = match.participants.map((p, i) => ({
        battingTeamId: p.teamId,
        runs: Number(cricketInputs[i].runs),
        wickets: Number(cricketInputs[i].wickets),
        oversFaced: Number(cricketInputs[i].oversFaced)
      }));
      await postOrPatch({ rawResult: { innings } });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit result');
    }
  };

  const submitPubg = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const squadResults = match.participants.map((p, i) => ({
        teamId: p.teamId,
        placement: Number(pubgInputs[i].placement),
        kills: Number(pubgInputs[i].kills)
      }));
      await postOrPatch({ rawResult: { squadResults } });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit result');
    }
  };

  const submitFootball = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const matchScores = match.participants.map((p, i) => ({
        teamId: p.teamId,
        goals: Number(footballInputs[i].goals)
      }));
      await postOrPatch({ rawResult: { matchScores } });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit result');
    }
  };

  const submitLabel = mode === 'correct' ? 'Save Correction' : 'Submit Result';

  if (match.discipline === 'cricket') {
    return (
      <form onSubmit={submitCricket} className="result-form">
        {match.participants.map((p, i) => (
          <div key={p.teamId} className="result-form-row">
            <span className="result-form-team">{p.teamNameSnapshot}</span>
            <input type="number" placeholder="Runs" value={cricketInputs[i].runs}
              onChange={(e) => setCricketInputs(cricketInputs.map((c, idx) => idx === i ? { ...c, runs: e.target.value } : c))} required />
            <input type="number" placeholder="Wickets" value={cricketInputs[i].wickets}
              onChange={(e) => setCricketInputs(cricketInputs.map((c, idx) => idx === i ? { ...c, wickets: e.target.value } : c))} required />
            <input type="number" placeholder="Overs" value={cricketInputs[i].oversFaced}
              onChange={(e) => setCricketInputs(cricketInputs.map((c, idx) => idx === i ? { ...c, oversFaced: e.target.value } : c))} required />
          </div>
        ))}
        <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
        {error && <p className="error-text">{error}</p>}
      </form>
    );
  }

  if (match.discipline === 'football') {
    return (
      <form onSubmit={submitFootball} className="result-form">
        {match.participants.map((p, i) => (
          <div key={p.teamId} className="result-form-row">
            <span className="result-form-team">{p.teamNameSnapshot}</span>
            <input type="number" placeholder="Goals" value={footballInputs[i].goals}
              onChange={(e) => setFootballInputs(footballInputs.map((c, idx) => idx === i ? { goals: e.target.value } : c))} required />
          </div>
        ))}
        <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
        {error && <p className="error-text">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={submitPubg} className="result-form">
      {match.participants.map((p, i) => (
        <div key={p.teamId} className="result-form-row">
          <span className="result-form-team">{p.teamNameSnapshot}</span>
          <input type="number" placeholder="Placement" value={pubgInputs[i].placement}
            onChange={(e) => setPubgInputs(pubgInputs.map((c, idx) => idx === i ? { ...c, placement: e.target.value } : c))} required />
          <input type="number" placeholder="Kills" value={pubgInputs[i].kills}
            onChange={(e) => setPubgInputs(pubgInputs.map((c, idx) => idx === i ? { ...c, kills: e.target.value } : c))} required />
        </div>
      ))}
      <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}