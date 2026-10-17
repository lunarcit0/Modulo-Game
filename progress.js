'use strict';
// Remove history retained by older versions; no practice data is saved.
try { localStorage.removeItem('lunarcit0-math-lab-progress-v1'); localStorage.removeItem('lunarcit0-math-lab-rewards-v1'); } catch {}
function practiceTopic(course, fallback) { return fallback; }
