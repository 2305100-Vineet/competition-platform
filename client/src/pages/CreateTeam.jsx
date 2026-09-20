import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';

export default function CreateTeam() {
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('cricket');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiClient.post('/teams', { name, discipline });
      toast.success('Team created');
      navigate(`/teams/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    }
  };

  return (
    <div className="page page-narrow">
      <h1>Create Team</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Register a new team you'll captain</p>
      <div className="section-card">
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Team name</label>
            <input placeholder="e.g. Mumbai Kings" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">Discipline</label>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
              <option value="cricket">Cricket</option>
              <option value="pubg">PUBG</option>
              <option value="football">Football</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create Team</button>
        </form>
        {error && <p className="error-text" style={{ marginTop: '0.75rem' }}>{error}</p>}
      </div>
    </div>
  );
}