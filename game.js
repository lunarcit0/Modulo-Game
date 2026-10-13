'use strict';
const $ = id => document.getElementById(id);
let round, score, streak, best, number, divisor, answered;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
function start() {
  round = 1; score = 0; streak = 0; best = 0;
  $('restart').hidden = true; $('form').hidden = false; $('hint').hidden = false;
  question();
}
function question() {
  const level = Math.min(3, 1 + Math.floor(score / 3));
  divisor = randomInt(2, [5, 8, 12][level - 1]);
  number = randomInt(0, [20, 50, 100][level - 1]);
  answered = false;
  $('level').textContent = `LEVEL ${level} · ${['WARM UP', 'FIND YOUR RHYTHM', 'PATTERN PRO'][level - 1]}`;
  $('round').textContent = `${String(round).padStart(2, '0')} / 10`;
  $('score').textContent = score; $('streak').textContent = streak;
  $('progress').style.width = `${(round - 1) * 10}%`;
  $('question').innerHTML = `${number} <span>mod</span> ${divisor}`;
  $('prompt').textContent = 'What’s the remainder?';
  $('feedback').textContent = ''; $('visual').hidden = true; $('next').hidden = true;
  $('answer').value = ''; $('answer').disabled = false; $('submit').disabled = false; $('hint').disabled = false;
  $('answer').focus();
}
function reveal() {
  const quotient = Math.floor(number / divisor), remainder = number % divisor;
  $('visual').hidden = false;
  $('caption').textContent = `${quotient} full groups · ${remainder} left over`;
  $('groups').replaceChildren();
  for (let g = 0; g < quotient + (remainder > 0 ? 1 : 0); g++) {
    const group = document.createElement('div');
    group.className = `group${g === quotient ? ' leftover' : ''}`;
    group.setAttribute('aria-label', `${g === quotient ? remainder : divisor} dots${g === quotient ? ' left over' : ' in a full group'}`);
    for (let d = 0; d < (g === quotient ? remainder : divisor); d++) {
      const dot = document.createElement('span'); dot.className = 'dot'; dot.setAttribute('aria-hidden', 'true'); group.append(dot);
    }
    $('groups').append(group);
  }
  if (!number) $('groups').textContent = 'Zero dots means zero groups and zero left over.';
  $('equation').textContent = `${number} = ${divisor} × ${quotient} + ${remainder}`;
  $('congruence').textContent = `Math: ${number} ≡ ${remainder} (mod ${divisor}) · Code: ${number} % ${divisor} = ${remainder}`;
}
$('form').addEventListener('submit', event => {
  event.preventDefault(); if (answered) return;
  const text = $('answer').value.trim();
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text))) {
    $('feedback').textContent = 'Enter a nonnegative whole number, like 0, 1, or 2.'; return;
  }
  answered = true;
  const right = Number(text) === number % divisor;
  if (right) { score++; streak++; best = Math.max(best, streak); } else streak = 0;
  $('feedback').textContent = right ? 'You got it! The dots below show why.' : `The remainder is ${number % divisor}. Let’s see how the groups work.`;
  $('score').textContent = score; $('streak').textContent = streak;
  $('progress').style.width = `${round * 10}%`;
  $('answer').disabled = true; $('submit').disabled = true; $('hint').disabled = true;
  reveal(); $('next').hidden = false; $('next').textContent = round === 10 ? 'See my results →' : 'Next round →'; $('next').focus();
});
$('hint').addEventListener('click', () => {
  $('feedback').textContent = `Find the largest multiple of ${divisor} that doesn’t exceed ${number}. Subtract that multiple from ${number}. Your remainder is between 0 and ${divisor - 1}.`;
});
$('next').addEventListener('click', () => {
  if (round < 10) { round++; question(); return; }
  $('level').textContent = 'SESSION COMPLETE'; $('prompt').textContent = 'You made time to practice.';
  $('question').textContent = `${score} / 10`;
  $('form').hidden = true; $('hint').hidden = true; $('next').hidden = true; $('visual').hidden = true;
  $('feedback').textContent = `${score * 10}% correct · Best streak: ${best}. ${score >= 8 ? 'The patterns are clicking. Keep building!' : 'Keep practicing: full groups first, then what’s left over.'}`;
  $('restart').hidden = false; $('restart').focus();
});
$('restart').addEventListener('click', start);
start();
