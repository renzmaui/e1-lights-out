import { useState } from 'react';

export default function RaceShell({ children }) {
  const [entered, setEntered] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  return <div className="race-shell">
    <div className="track-top"><span className="brand-mark">E<span>1</span></span><span className="top-label">RACE CONTROL / REACTION TEST</span></div>
    {!entered ? <section className="intro-screen" aria-labelledby="intro-title"><div className="intro-copy"><span className="kicker"><i /> THE GRID IS YOURS</span><h1 id="intro-title">LIGHTS<span>OUT.</span></h1><p>Five red lights. One unpredictable start. How fast are your reflexes?</p><button className="enter-button" onClick={() => setEntered(true)}>ENTER THE GRID <span aria-hidden="true">↗</span></button><div className="intro-steps"><span><b>01</b> ENTER YOUR NAME</span><span><b>02</b> WATCH THE LIGHTS</span><span><b>03</b> TAP WHEN THEY GO OUT</span></div></div><div className="intro-visual" aria-hidden="true"><div className="intro-gantry">{Array.from({length:5},(_,i)=><div className="intro-light" key={i}><span/><span/></div>)}</div><strong>WAIT FOR IT.</strong><div className="intro-line"/></div></section> : children}
    <aside className={'fan-disclaimer ' + (disclaimerOpen ? 'expanded' : '')}><button type="button" aria-expanded={disclaimerOpen} aria-controls="disclaimer-copy" onClick={() => setDisclaimerOpen(v => !v)}>♡Made by ENGENEs, for ENGENEs <span aria-hidden="true">{disclaimerOpen ? '×' : '+'}</span></button>{disclaimerOpen && <div id="disclaimer-copy"><p>This is an unofficial, non-commercial fan-made game. It is not affiliated with, sponsored by, or endorsed by ENHYPEN, BELIFT LAB, or HYBE. ENHYPEN music and other third-party media featured in the game belong to their respective rights holders.</p><div className="disclaimer-links"><a href="https://ensite.org/" target="_blank" rel="noopener noreferrer">ensite.org</a><span aria-hidden="true"> | </span><a href="https://x.com/pocketzarmy" target="_blank" rel="noopener noreferrer">@pocketzarmy</a></div></div>}</aside>
  </div>;
}
