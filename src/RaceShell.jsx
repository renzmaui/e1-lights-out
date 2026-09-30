import { useState } from 'react';

export default function RaceShell({ children }) {
  const [entered, setEntered] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  return <div className="race-shell">
    <div className="track-top"><span className="brand-mark">E<span>1</span></span><span className="top-label">RACE CONTROL / REACTION TEST</span><span className="top-number">01—05</span></div>
    {!entered ? <section className="intro-screen" aria-labelledby="intro-title"><div className="intro-copy"><span className="kicker"><i /> THE GRID IS YOURS</span><h1 id="intro-title">LIGHTS<span>OUT.</span></h1><p>Five red lights. One unpredictable start. How fast are your reflexes?</p><button className="enter-button" onClick={() => setEntered(true)}>ENTER THE GRID <span aria-hidden="true">↗</span></button><div className="intro-steps"><span><b>01</b> ENTER YOUR NAME</span><span><b>02</b> WATCH THE LIGHTS</span><span><b>03</b> TAP WHEN THEY GO OUT</span></div></div><div className="intro-visual" aria-hidden="true"><div className="intro-gantry">{Array.from({length:5},(_,i)=><div className="intro-light" key={i}><span/><span/></div>)}</div><strong>WAIT FOR IT.</strong><div className="intro-line"/></div></section> : children}
    <aside className={'fan-disclaimer ' + (disclaimerOpen ? 'expanded' : '')}><button type="button" aria-expanded={disclaimerOpen} aria-controls="disclaimer-copy" onClick={() => setDisclaimerOpen(v => !v)}><span className="disc-dot"/> FAN-MADE PROJECT <span aria-hidden="true">{disclaimerOpen ? '×' : '+'}</span></button>{disclaimerOpen && <p id="disclaimer-copy">Unofficial fan-made reaction game. Not affiliated with, endorsed by, or sponsored by ENHYPEN, BELIFT LAB, MAMA, Formula 1, or their partners. Names and marks belong to their respective owners.</p>}</aside>
  </div>;
}
