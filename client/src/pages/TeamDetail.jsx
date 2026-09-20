import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserPlus } from 'lucide-react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { getDisciplineImage } from '../utils/disciplineImages';

export default function TeamDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [team, setTeam] = useState(null);
  const [myProfiles, setMyProfiles] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [role, setRole] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    apiClient.get(`/teams/${id}`),
    apiClient.get('/players/me')
  ]).then(([tRes, pRes]) => {
    setTeam(tRes.data);
    setMyProfiles(pRes.data.filter((p) => p.discipline === tRes.data.discipline));
  });

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  const createProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/players', { discipline: team.discipline, displayName: newProfileName });
      setNewProfileName('');
      await load();
      toast.success('Player profile created');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create player profile');
    }
  };

  const addToRoster = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post(`/teams/${id}/roster`, { playerId: selectedPlayerId, role });
      setSelectedPlayerId('');
      setRole('');
      await load();
      toast.success('Added to roster');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to roster');
    }
  };

  if (loading) return <div className="page"><p className="loading-text">Loading...</p></div>;
  if (!team) return <div className="page"><div className="empty-state">Team not found</div></div>;

  const rosterPlayerIds = team.roster.filter((m) => !m.leftAt).map((m) => m.playerId);
  const availableProfiles = myProfiles.filter((p) => !rosterPlayerIds.includes(p._id));
  const thumb = getDisciplineImage(team.discipline, team._id, 'auto=format&fit=crop&w=400&q=80');

  return (
    <div className="page">
      <div className="page-header team-detail-header">
        {thumb && <img src={thumb} alt="" className="team-detail-thumb" />}
        <div>
          <h1>{team.name}</h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{team.discipline}</p>
        </div>
      </div>

      <h2><Users size={18} className="section-icon" /> Roster</h2>
      {team.roster.length === 0 ? (
        <div className="empty-state">No players on the roster yet.</div>
      ) : (
        <div className="section-card">
          {team.roster.map((m) => (
            <div key={m.playerId} className="roster-item">
              <span>{m.role || 'Player'}</span>
            </div>
          ))}
        </div>
      )}

      <h2><UserPlus size={18} className="section-icon" /> Add Player</h2>
      <div className="section-card">
        {availableProfiles.length > 0 ? (
          <form onSubmit={addToRoster}>
            <div className="field-group">
              <label className="field-label">Player profile</label>
              <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} required>
                <option value="">Select a player profile</option>
                {availableProfiles.map((p) => (
                  <option key={p._id} value={p._id}>{p.displayName}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Role (optional)</label>
              <input placeholder="e.g. batsman, IGL" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Add to Roster</button>
          </form>
        ) : (
          <p className="page-subtitle" style={{ margin: 0 }}>Create a player profile below to add yourself to this roster.</p>
        )}
      </div>

      <h2>Create Player Profile</h2>
      <div className="section-card">
        <form onSubmit={createProfile}>
          <div className="field-group">
            <label className="field-label">Display name</label>
            <input placeholder="Your display name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Create Profile</button>
        </form>
      </div>

      {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}