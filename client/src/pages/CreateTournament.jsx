import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';

export default function CreateTournament() {
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('cricket');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiClient.post('/tournaments', { name, discipline, maxParticipants: Number(maxParticipants) });
      toast.success('Tournament created');
      navigate(`/tournaments/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    }
  };

  return (
    <div className="page page-narrow">
      <h1>Create Tournament</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Set up a new competition</p>
      <div className="section-card">
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Tournament name</label>
            <input placeholder="e.g. Winter Cricket Cup" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">Discipline</label>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
              <option value="cricket">Cricket</option>
              <option value="pubg">PUBG</option>
              <option value="football">Football</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Max participants</label>
            <input type="number" min="2" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create Tournament</button>
        </form>
        {error && <p className="error-text" style={{ marginTop: '0.75rem' }}>{error}</p>}
      </div>
    </div>
  );
}