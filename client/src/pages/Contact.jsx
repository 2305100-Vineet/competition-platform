import { Mail, MessageCircle } from 'lucide-react';

export default function Contact() {
  return (
    <div className="page static-page">
      <h1>Contact Us</h1>
      <p>Have a question, found a bug, or want to suggest a feature? We'd love to hear from you.</p>
      <div className="section-card contact-card">
        <div className="contact-item">
          <Mail size={18} />
          <span>support@competitionhub.com</span>
        </div>
        <div className="contact-item">
          <MessageCircle size={18} />
          <span>We typically respond within 1–2 business days.</span>
        </div>
      </div>
    </div>
  );
}