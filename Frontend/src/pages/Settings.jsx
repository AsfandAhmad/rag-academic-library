import React, { useEffect, useState } from 'react';
import { getMe } from '../apis/axios';

export default function Settings(){
  const [user, setUser] = useState(null);

  useEffect(()=>{ (async ()=>{
    try{ const res = await getMe(); setUser(res.data); }catch(e){ setUser(null); }
  })(); },[]);

  return (
    <div style={{padding:24}}>
      <h1 style={{color:'var(--text-primary)'}}>Settings</h1>
      <div style={{marginTop:12}} className="card">
        <h3 style={{margin:0,color:'var(--text-secondary)'}}>Profile</h3>
        {user ? (
          <div style={{marginTop:8}}>
            <div><strong style={{color:'var(--text-primary)'}}>Name:</strong> <span style={{color:'var(--text-secondary)'}}>{user.name}</span></div>
            <div><strong style={{color:'var(--text-primary)'}}>Email:</strong> <span style={{color:'var(--text-secondary)'}}>{user.email}</span></div>
            <div><strong style={{color:'var(--text-primary)'}}>Role:</strong> <span style={{color:'var(--text-secondary)'}}>{user.role}</span></div>
          </div>
        ) : (
          <div style={{color:'var(--text-tertiary)'}}>Not signed in.</div>
        )}
      </div>

      <div style={{marginTop:16}} className="card">
        <h3 style={{margin:0,color:'var(--text-secondary)'}}>Accessibility</h3>
        <div style={{marginTop:8,color:'var(--text-secondary)'}}>Adjust text size and contrast for comfortable reading.</div>
        <div style={{marginTop:12,display:'flex',gap:8}}>
          <button className="btn-outline">Increase text</button>
          <button className="btn-outline">Decrease text</button>
          <button className="btn-outline">Toggle high contrast</button>
        </div>
      </div>
    </div>
  );
}
