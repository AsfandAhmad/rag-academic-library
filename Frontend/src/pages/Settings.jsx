import React, { useEffect, useState } from 'react';
import { getMe } from '../apis/axios';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';

export default function Settings(){
  const [user, setUser] = useState(null);
  const {
    theme,
    toggleTheme,
    textScale,
    increaseText,
    decreaseText,
    highContrast,
    setHighContrast,
    resetAccessibility,
  } = useTheme();

  useEffect(()=>{ (async ()=>{
    try{ const res = await getMe(); setUser(res.data); }catch(e){ setUser(null); }
  })(); },[]);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-description">Manage your profile and reading preferences</p>
            </div>
          </div>
        </div>

        <div className="page-content settings-content">
          <section className="settings-card">
            <h2 className="settings-card-title">Profile</h2>
            {user ? (
              <div className="profile-list">
                <div><strong>Name:</strong> <span>{user.name}</span></div>
                <div><strong>Email:</strong> <span>{user.email}</span></div>
                <div><strong>Role:</strong> <span>{user.role}</span></div>
              </div>
            ) : (
              <div className="empty-state compact">Not signed in.</div>
            )}
          </section>

          <section className="settings-card">
            <h2 className="settings-card-title">Accessibility</h2>
            <p className="settings-copy">Adjust text size and contrast for comfortable reading.</p>
            <div className="settings-status-grid">
              <div>
                <span>Text size</span>
                <strong>{textScale === 0 ? 'Default' : textScale > 0 ? `+${textScale}` : textScale}</strong>
              </div>
              <div>
                <span>Contrast</span>
                <strong>{highContrast ? 'High' : 'Standard'}</strong>
              </div>
            </div>
            <div className="settings-actions">
              <button className="btn-secondary" onClick={increaseText} disabled={textScale >= 2}>
                Increase text
              </button>
              <button className="btn-secondary" onClick={decreaseText} disabled={textScale <= -1}>
                Decrease text
              </button>
              <button className="btn-secondary" onClick={() => setHighContrast(!highContrast)}>
                {highContrast ? 'Standard contrast' : 'High contrast'}
              </button>
            </div>
          </section>

          <section className="settings-card">
            <h2 className="settings-card-title">Appearance</h2>
            <p className="settings-copy">Switch between the dark archive theme and a lighter reading theme.</p>
            <div className="settings-status-grid">
              <div>
                <span>Theme</span>
                <strong>{theme === 'light' ? 'Light' : 'Dark'}</strong>
              </div>
            </div>
            <div className="settings-actions">
              <button className="btn-secondary" onClick={toggleTheme}>
                {theme === 'light' ? 'Use dark theme' : 'Use light theme'}
              </button>
              <button className="btn-secondary" onClick={resetAccessibility}>
                Reset accessibility
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
