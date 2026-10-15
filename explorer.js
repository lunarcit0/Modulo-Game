'use strict';
function graphModel(mode,x,c,adaptive=false){
 const y=mode==='sum'?(adaptive?-x:c):x*x;
 return {x,y,value:mode==='sum'?x+y:y,valid:mode==='sum'?Math.abs(x+y)<1e-8:mode==='positive'?y>0:Number.isInteger(x)&&y===2};
}
function mountExplorer(container,mode){
 container.className='explorer';
 container.innerHTML=`<h3>INTERACTIVE GRAPH · ${mode==='sum'?'x + y = 0':mode==='positive'?'x² > 0':'n² = 2 over the integers'}</h3>${mode==='sum'?'<select class="graph-order" aria-label="Quantifier order"><option value="fixed">∃y ∀x: fix one y, then test different x</option><option value="adaptive">∀x ∃y: choose y = −x after choosing x</option></select>':''}<div class="plot"></div><div class="slider-row"><label>${mode==='integer'?'Integer n':'Test x'}</label><input class="graph-x" aria-label="${mode==='integer'?'Integer n':'Test x'}" type="range" min="-4" max="4" step="${mode==='integer'?'1':'0.1'}" value="1"><output class="x-value"></output></div>${mode==='sum'?'<div class="slider-row fixed-slider"><label>Fixed y</label><input class="graph-y" aria-label="Fixed y" type="range" min="-4" max="4" step="0.1" value="1"><output class="y-value"></output></div>':''}<div class="graph-result" role="status" aria-live="polite"></div><p class="graph-legend"></p>`;
 const get=s=>container.querySelector(s);
 function draw(){
  const x=Number(get('.graph-x').value),c=mode==='sum'?Number(get('.graph-y').value):0,adaptive=mode==='sum'&&get('.graph-order').value==='adaptive',m=graphModel(mode,x,c,adaptive);
  const X=v=>55+(v+5)*34,Y=v=>mode==='sum'?210-v*34:330-v*17;
  let svg='';
  for(let k=-5;k<=5;k++){svg+=`<path d="M ${X(k)} 30 V 380" stroke="#e3e9df"/>`;if(k)svg+=`<text x="${X(k)}" y="${mode==='sum'?Y(0)+16:350}" text-anchor="middle" font-size="11" fill="#66756a">${k}</text>`;}
  const ymin=mode==='sum'?-5:0,ymax=mode==='sum'?5:16,ystep=mode==='sum'?1:2;
  for(let k=ymin;k<=ymax;k+=ystep){svg+=`<path d="M 55 ${Y(k)} H 395" stroke="#e3e9df"/>`;if(k)svg+=`<text x="45" y="${Y(k)+4}" text-anchor="end" font-size="11" fill="#66756a">${k}</text>`;}
  svg+=`<path d="M 55 ${Y(0)} H 405 M ${X(0)} 20 V 385" stroke="#66756a"/><text x="408" y="${Y(0)-6}" font-size="13">${mode==='integer'?'n':'x'}</text><text x="${X(0)+8}" y="22" font-size="13">y</text>`;
  if(mode==='sum'){
   svg+=`<path d="M ${X(-5)} ${Y(5)} L ${X(5)} ${Y(-5)}" stroke="#335e49" stroke-width="3"/>`;
   if(!adaptive)svg+=`<path d="M 55 ${Y(c)} H 395" stroke="#b5841c" stroke-width="3" stroke-dasharray="7 5"/><circle cx="${X(-c)}" cy="${Y(c)}" r="5" fill="#335e49"/>`;
   get('.fixed-slider').hidden=adaptive;get('.y-value').textContent=c.toFixed(1);
   get('.graph-legend').textContent='Green: all solutions y = −x. Gold dashed: your fixed y. The colored point is the (x, y) you are testing.';
  }else{
   let path='';for(let i=0;i<=100;i++){const v=-4+i*.08;path+=`${i?'L':'M'} ${X(v)} ${Y(v*v)} `;}svg+=`<path d="${path}" fill="none" stroke="#335e49" stroke-width="3"/>`;
   if(mode==='integer'){svg+=`<path d="M 55 ${Y(2)} H 395" stroke="#b5841c" stroke-dasharray="7 5" stroke-width="2"/>`;for(let n=-4;n<=4;n++)svg+=`<circle cx="${X(n)}" cy="${Y(n*n)}" r="4" fill="#335e49"/>`;for(const v of [-Math.sqrt(2),Math.sqrt(2)])svg+=`<circle cx="${X(v)}" cy="${Y(2)}" r="5" fill="white" stroke="#b5841c" stroke-width="2"/>`;}
   get('.graph-legend').textContent=mode==='integer'?'Green dots: allowed integer inputs. Gold: y = 2. Hollow intersections at ±√2 are real solutions, but are not integers.':'Green: y = x². The point at x = 0 touches y = 0, so the strict inequality x² > 0 fails there.';
  }
  svg+=`<circle cx="${X(x)}" cy="${Y(m.y)}" r="7" fill="${m.valid?'#335e49':'#b35441'}" stroke="white" stroke-width="2"/>`;
  get('.plot').innerHTML=`<svg viewBox="0 0 450 410" role="img" aria-label="Interactive coordinate graph of ${mode==='sum'?'y equals negative x':'y equals x squared'}"><g font-family="Arial,sans-serif">${svg}</g></svg>`;
  get('.x-value').textContent=mode==='integer'?x:x.toFixed(1);
  get('.graph-result').textContent=mode==='sum'?`x = ${x.toFixed(1)}, y = ${m.y.toFixed(1)} → x + y = ${m.value.toFixed(1)}. ${m.valid?'This pair works.':'This pair fails.'} ${adaptive?'Here y changes with x, so every x can have a solution.':'For one fixed y, only x = −y works. Move x to find a failure.'}`:mode==='positive'?`x = ${x.toFixed(1)} → x² = ${m.value.toFixed(2)}. ${m.valid?'Positive for this input.':'Not strictly positive: x = 0 is a counterexample.'}`:`n = ${x} → n² = ${m.value}. No integer dot lies on y = 2. The crossings occur between integer inputs.`;
 }
 container.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',draw));draw();
}
