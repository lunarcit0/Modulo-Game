'use strict';
(() => {
 const el=id=>document.getElementById('bit-'+id), modes=['bd','db','bh','hb','bt','tb'];
 let round,score,question,answered,done,running,elapsed,started;
 const time=()=>elapsed+(running?Date.now()-started:0);
 const stamp=()=>{el('timer').textContent=timeText(time());};
 function start(){if(done||running)return;started=Date.now();running=true;el('start').disabled=true;el('stop').disabled=false;}
 function stop(){elapsed=time();running=false;el('start').disabled=done;el('stop').disabled=true;stamp();}
 function next(){
  const selected=el('topic').value,mode=selected==='mixed'?modes[Math.floor(Math.random()*4)]:selected;
  const n=1+Math.floor(Math.random()*(round<=3?31:255));
  const bin=n.toString(2),hex=n.toString(16).toUpperCase();
  const from=mode[0],to=mode[1],values={b:bin,d:String(n),h:hex,t:n.toString(12).toUpperCase()},names={b:'binary',d:'decimal',h:'hexadecimal',t:'base 12'},bases={b:2,d:10,h:16,t:12};
  const weighted=bin.split('').map((digit,i)=>digit==='1'?String(2**(bin.length-1-i)):null).filter(Boolean).join(' + ');
  const groups=bin.padStart(Math.ceil(bin.length/4)*4,'0').match(/.{4}/g);
  const grouping=groups.map(g=>`${g}₂ = ${parseInt(g,2).toString(16).toUpperCase()}₁₆`).join('; ');
  const dozen=n.toString(12).toUpperCase(),dozenSteps=dozen.split('').map((d,i)=>`${parseInt(d,12)} × 12^${dozen.length-1-i}`).join(' + ');
  question={n,from,to,base:bases[to],answer:values[to],explanation:(mode==='bt'||mode==='tb')?`${bin}₂ = ${weighted} = ${n}₁₀.\n${dozen} (base 12) = ${dozenSteps} = ${n}₁₀.\nSo ${bin}₂ = ${dozen} (base 12). A = 10; B = 11.`:(mode==='bd'||mode==='db'?`${bin}₂ = ${weighted} = ${n}₁₀.`:`Group bits in fours from the right (pad the left with zeros):\n${grouping}.\n${bin}₂ = ${hex}₁₆.`)};
  answered=false;el('round').textContent=`${round} / 10`;el('score').textContent=score;
  el('question').textContent=`Convert ${values[from]} (base ${bases[from]}) to ${names[to]}.`;
  el('label').textContent=to==='t'?'Answer in base 12. A = 10; B = 11.':`Answer in ${names[to]} (base ${bases[to]}).${from==='t'?' In base 12: A = 10; B = 11.':''}`;
  el('answer').value='';el('answer').disabled=false;el('answer').placeholder=to==='b'?'e.g. 1010':to==='h'?'e.g. A':to==='t'?'e.g. 1B':'e.g. 10';
  el('answer').inputMode=(to==='h'||to==='t')?'text':'numeric';el('feedback').textContent='';el('next').hidden=true;el('hint').hidden=false;el('form').hidden=false;
 }
 function reset(){round=1;score=0;done=false;running=false;elapsed=0;started=Date.now();el('start').disabled=false;el('stop').disabled=true;el('restart').hidden=true;stamp();next();}
 el('form').addEventListener('submit',e=>{
  e.preventDefault();if(answered||done)return;
  const raw=el('answer').value.trim().toUpperCase(),valid=question.to==='b'?/^[01]+$/:question.to==='h'?/^[0-9A-F]+$/:question.to==='t'?/^[0-9AB]+$/:/^\d+$/;
  if(!valid.test(raw)){el('feedback').textContent=question.to==='b'?'Use only binary digits 0 and 1.':question.to==='h'?'Use hexadecimal digits 0–9 and A–F.':question.to==='t'?'Use base 12 digits 0–9, A (ten), and B (eleven).':'Enter a whole decimal number.';return;}
  start();answered=true;const right=parseInt(raw,question.base)===question.n;if(right)score++;
  el('score').textContent=score;el('answer').disabled=true;el('hint').hidden=true;
  el('feedback').textContent=(right?'Correct!':'Answer: '+question.answer)+ '\n'+question.explanation;
  el('next').textContent=round===10?'See results →':'Next →';el('next').hidden=false;
 });
 el('hint').addEventListener('click',()=>{el('feedback').textContent=(question.from==='t'||question.to==='t')?'Convert through decimal: binary uses powers of 2; base 12 uses powers of 12. A = 10 and B = 11. To build a base 12 answer, divide the decimal value by 12 repeatedly and read the remainders in reverse.':question.to==='h'?'Group binary digits into blocks of four, starting from the right. Each block becomes one hex digit.':question.to==='b'?'For decimal, build the number with powers of 2. For hexadecimal, replace each hex digit with four bits.':'Use place values 128, 64, 32, 16, 8, 4, 2, 1. Add the values where the bit is 1.';});
 el('next').addEventListener('click',()=>{if(round<10){round++;next();return;}done=true;stop();el('question').textContent=`${score} / 10`;el('feedback').textContent=`Session complete · ${timeText(elapsed)}`;el('form').hidden=true;el('hint').hidden=true;el('next').hidden=true;el('restart').hidden=false;});
 el('start').addEventListener('click',start);el('stop').addEventListener('click',stop);el('restart').addEventListener('click',reset);el('topic').addEventListener('change',reset);
 ['focus','pointerdown','input'].forEach(event=>el('answer').addEventListener(event,()=>{if(!el('answer').disabled)start();}));
 setInterval(stamp,250);reset();
})();
