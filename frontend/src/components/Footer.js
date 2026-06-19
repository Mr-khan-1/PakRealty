import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <div className="footer-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 21V12h6v9" stroke="#60a5fa" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>PakRealty</span>
          </div>
          <p>Pakistan's trusted platform for buying, selling, and renting properties. Find your dream home with ease.</p>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-icon">f</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="social-icon">t</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon">in</a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Properties</h4>
          <ul>
            <li><Link to="/properties?city=Islamabad">Islamabad</Link></li>
            <li><Link to="/properties?city=Lahore">Lahore</Link></li>
            <li><Link to="/properties?city=Karachi">Karachi</Link></li>
            <li><Link to="/properties?purpose=rent">For Rent</Link></li>
            <li><Link to="/properties?purpose=sale">For Sale</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Platform</h4>
          <ul>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/investor">Investor Hub</Link></li>
            <li><Link to="/comparison">Compare Properties</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Company</h4>
          <ul>
            <li><Link to="/">About Us</Link></li>
            <li><Link to="/">Contact</Link></li>
            <li><Link to="/">Privacy Policy</Link></li>
            <li><Link to="/">Terms of Service</Link></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} PakRealty. All rights reserved.</p>
      </div>
    </footer>
  );
}
