import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './result-enhancements.css';

const TAGS = '#ENHYPEN #ENGENE #EMGP2026 #MAMA2026 #EnhypenMamaGrandPrix2026';

export default function ResultEnhancements() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const update = () => {
      const target = document.querySelector('.result-actions');
      const raw = document.querySelector('.result-time')?.textContent || '';
      const time = Number.parseFloat(raw);
      const name = document.querySelector('#player-name')?.value.trim() || 'Maui';
      setResult(previous => previous?.target === target && previous?.time === time && previous?.name === name ? previous : target && Number.isFinite(time) ? { target, time, name } : null);
    };
    const observer = new MutationObserver(update);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    update();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      if (this.width === 1080 && this.height === 1350) {
        const ctx = this.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.fillStyle = '#171717';
          ctx.font = '700 18px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(TAGS, 540, 1310, 950);
          ctx.restore();
        }
      }
      return original.call(this, callback, type, quality);
    };
    return () => { HTMLCanvasElement.prototype.toBlob = original; };
  }, []);
  if (!result) return null;
  const text = `🏎️ E1 — LIGHTS OUT\n${result.name} reacted in ${result.time.toFixed(3)} seconds! Can you beat my time?\n\n${TAGS}`;
  const href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`;
  return createPortal(<a className="share-x-button" href={href} target="_blank" rel="noopener noreferrer" aria-label="Share your reaction time as a text post on X; attach your saved proof image separately">SHARE TO X ↗</a>, result.target);
}
