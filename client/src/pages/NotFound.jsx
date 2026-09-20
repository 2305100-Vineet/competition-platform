import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page not-found-page">
      <Trophy size={40} className="not-found-icon" />
      <h1>404</h1>
      <p className="page-subtitle">This page doesn't exist — maybe the match got called off.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}