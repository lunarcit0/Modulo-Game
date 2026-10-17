'use strict';
// Reuse each section's Start action so pause/resume and completion guards stay consistent.
for (const [answerId, startId] of [
  ['answer','clock-start'], ['prob-answer','prob-clock-start'],
  ['num-answer','num-clock-start'], ['ode-answer','ode-clock-start'], ['ar-answer','ar-start']
]) {
  const answer = document.getElementById(answerId);
  const start = document.getElementById(startId);
  const begin = () => { if (!answer.disabled && !start.disabled) start.click(); };
  for (const event of ['pointerdown','focus','input']) answer.addEventListener(event, begin);
}
