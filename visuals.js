'use strict';
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svgText=(x,y,t,color='#3f3039',size=13)=>`<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" text-anchor="middle">${escapeHTML(t)}</text>`;
const svgWrap=(body,label)=>`<svg viewBox="0 0 420 260" role="img" aria-label="${escapeHTML(label)}">${body}</svg>`;
function flowDiagram(nodes){return `<div class="concept-flow">${nodes.map((n,i)=>`${i?'<div class="concept-arrow" aria-hidden="true">↓</div>':''}<div class="concept-node">${escapeHTML(n)}</div>`).join('')}</div>`;}
function quantifierGraph(q){
 let body='';for(let k=-4;k<=4;k++){const p=210+25*k;body+=`<path d="M ${p} 20 V 230 M 110 ${130+25*k} H 310" stroke="#eadce2"/>`;if(k)body+=svgText(p,145,k,'#7a6872',10);}
 body+='<path d="M 100 130 H 320 M 210 15 V 240" stroke="#7a6872"/><path d="M 110 30 L 310 230" stroke="#92536f" stroke-width="3"/>';
 body+=svgText(300,248,'x')+svgText(230,18,'y')+svgText(130,18,'Solutions: y = −x');
 const fixed=q.prompt.includes('∃y');
 if(fixed){body+='<path d="M 110 105 H 310" stroke="#b5841c" stroke-width="3" stroke-dasharray="6 4"/><circle cx="185" cy="105" r="5" fill="#92536f"/><circle cx="260" cy="105" r="5" fill="#b35441"/>';body+=svgText(340,105,'y = 1', '#b5841c',12);body+=svgText(285,90,'(2, 1) fails','#b35441',11);return svgWrap(body,'The solution line y equals negative x meets a fixed horizontal y equals 1 line only at x equals negative 1.')+'<p>Example fixed choice: y = 1. Only x = −1 works. For any fixed y, choose x = 1 − y: then x + y = 1, so it fails.</p>';}
 for(const x of [-2,0,2])body+=`<circle cx="${210+25*x}" cy="${130+25*x}" r="5" fill="#92536f"/>`;
 return svgWrap(body,'Every chosen x has a point on y equals negative x, with its own y value.')+'<p>Move along the green line: each x has its own y = −x. The y may change after x is chosen.</p>';
}
function showConceptVisual(q){
 const box=$('concept-visual');box.hidden=false;let html='<h3>SEE THE REASONING</h3>';
 if(q.topic==='logic'){
  html+='<table><caption>Core truth table · highlighted row breaks the implication</caption><thead><tr><th>P</th><th>Q</th><th>P ∧ Q</th><th>P ∨ Q</th><th>P ⇒ Q</th><th>¬Q ⇒ ¬P</th></tr></thead><tbody>';
  for(const [p,r] of [[true,true],[true,false],[false,true],[false,false]]){const t=b=>b?'T':'F';html+=`<tr class="${p&&!r?'fail':''}"><td>${t(p)}</td><td>${t(r)}</td><td>${t(p&&r)}</td><td>${t(p||r)}</td><td>${t(!p||r)}</td><td>${t(r||!p)}</td></tr>`;}html+='</tbody></table>';
  html+=flowDiagram([q.prompt,`Correct result: ${q.answer}`,q.explanation]);
 }else if(q.topic==='quantifiers'&&q.prompt.includes('x + y = 0')) html+=quantifierGraph(q);
 else if(q.topic==='quantifiers'){
  let b='';const universal=q.prompt.includes('∀')||q.prompt.includes('universal');
  for(let i=0;i<5;i++){b+=`<circle cx="${55+i*77}" cy="95" r="20" fill="${i===3?'#efc961':'#c58ca7'}"/>`;b+=svgText(55+i*77,100,['a','b','c','d','e'][i]);}
  b+=svgText(210,35,'Example domain: five objects', '#7a6872');b+=svgText(210,150,universal?'∀ checks every object; one failure is enough.':'∃ needs at least one witness.');b+=svgText(210,180,'Negation swaps ∀ ↔ ∃ and negates the predicate.');
  html+=svgWrap(b,'Illustrative finite domain for understanding universal and existential quantifiers. The question may have an infinite domain.');html+='<p>This finite domain is an illustration of the rule, not a plot of all real numbers.</p>'+flowDiagram([q.prompt,`Correct result: ${q.answer}`,q.explanation]);
 }else if(q.topic==='divisibility'){
  const match=q.prompt.match(/Is (-?\d+) ≡ (-?\d+) \(mod (\d+)\)/)||q.prompt.match(/Does (\d+) ∣ (-?\d+)/);
  const congruent=q.prompt.startsWith('Is'),d=Number(congruent?match[3]:match[1]),a=Number(congruent?match[1]:match[2]),b=congruent?Number(match[2]):0;
  const low=Math.min(a,b)-d,high=Math.max(a,b)+d,map=v=>35+(v-low)/(high-low)*350;let body='<path d="M 25 130 H 395" stroke="#7a6872"/>';
  for(let k=Math.ceil(low/d);k<=Math.floor(high/d);k++){const v=k*d;body+=`<circle cx="${map(v)}" cy="130" r="3" fill="#c58ca7"/>`;}
  for(const [v,label,color] of [[a,'a','#92536f'],[b,congruent?'b':'0','#b5841c']]){body+=`<path d="M ${map(v)} 95 V 140" stroke="${color}" stroke-width="2"/>`+svgText(map(v),80,`${label} = ${v}`,color);}
  body+=svgText(210,180,`Difference = ${a-b}; modulus = ${d}`)+svgText(210,210,`${a-b} / ${d} ${(a-b)%d===0?'is':'is not'} an integer`);
  html+=svgWrap(body,`Number line marking ${a} and ${b}; dots are multiples of ${d}.`)+`<p>Small dots mark multiples of ${d}. ${congruent?'Congruence asks whether the distance, with sign, is a multiple of the modulus.':'Divisibility asks whether a lands on a multiple of the divisor.'}</p>`;
 }else if(q.topic==='sets'){
  if(q.type==='set'){
   const groups=q.prompt.match(/A = (∅|\{[^}]*\}), B = (∅|\{[^}]*\})/);const parse=s=>s==='∅'?[]:s.slice(1,-1).split(',').map(Number);const A=parse(groups[1]),B=parse(groups[2]);
   html+='<table><caption>Membership map</caption><tr><th>Element</th><th>In A?</th><th>In B?</th><th>In result?</th></tr>';
   for(let n=1;n<=6;n++)html+=`<tr><td>${n}</td><td>${A.includes(n)?'●':'—'}</td><td>${B.includes(n)?'●':'—'}</td><td>${q.answer.includes(n)?'●':'—'}</td></tr>`;html+='</table>';
  }else if(q.prompt.includes('𝒫')||q.prompt.includes('elements')||q.prompt.includes('∈')||q.prompt.includes('⊆')||q.prompt.includes('partition')||q.prompt.includes('A₁')){
   let nodes;
   if(q.prompt.includes('|A|'))nodes=['Each element has two choices: included / excluded',q.prompt,`Multiply those choices: ${q.answer} subsets`];
   else if(q.prompt.includes('𝒫({a, b})'))nodes=['Choose neither → ∅','Choose a only → {a}; choose b only → {b}','Choose both → {a, b}','Four choices together form 𝒫({a, b})'];
   else if(q.prompt.includes('{{∅}}'))nodes=['Outer set: {{∅}}','Its one element: {∅}','Inside that element: ∅','Only the outermost elements count: 1'];
   else if(q.prompt.includes('{1} ∈'))nodes=['Set {1, 2} → element 1 and element 2','The object {1} is itself a set','{1} is a subset, but not an element of {1, 2}'];
   else if(q.prompt.includes('partition'))nodes=['S split into nonempty cells','Every element of S belongs to a cell','No element belongs to two different cells','All three conditions give a partition'];
   else if(q.prompt.includes('A₁'))nodes=['A₁ sits inside A₂','A₂ sits inside A₃','Common to all three: precisely A₁'];
   else nodes=[q.prompt,`Correct result: ${q.answer}`,q.explanation];
   html+=flowDiagram(nodes);
  }else{
   let b='<rect x="30" y="30" width="360" height="200" rx="15" fill="none" stroke="#cfa9b9"/><ellipse cx="165" cy="130" rx="85" ry="65" fill="#c58ca7" fill-opacity=".2" stroke="#92536f"/><ellipse cx="260" cy="130" rx="85" ry="65" fill="#efc961" fill-opacity=".3" stroke="#b5841c"/>';
   b+=svgText(45,52,'U')+svgText(120,115,'A only')+svgText(212,140,'A ∩ B')+svgText(300,115,'B only')+svgText(210,218,'Outside both: Aᶜ ∩ Bᶜ');html+=svgWrap(b,'Illustrative Venn diagram with A only, both sets, B only, and neither.');html+='<p>Set-operation reference: union includes both circles; intersection includes their overlap. Other set questions use the definition shown below.</p>';
  }html+=flowDiagram([q.prompt,`Correct result: ${Array.isArray(q.answer)?setText(q.answer):q.answer}`,q.explanation]);
 }else if(q.topic==='proofs'){
  let nodes;
  if(q.prompt.includes('contrapositive'))nodes=['Goal: n² even ⇒ n even','Contrapositive: n odd ⇒ n² odd','Write n = 2k + 1','n² = 2(2k² + 2k) + 1: odd'];
  else if(q.prompt.includes('P ⇔ Q'))nodes=['P ⇔ Q','Forward: assume P, prove Q','Backward: assume Q, prove P','Both directions complete the proof'];
  else if(q.prompt.includes('n(n + 1)'))nodes=['Every integer n','Case 1: n even → n supplies a factor 2','Case 2: n odd → n + 1 supplies a factor 2','Both cases: n(n + 1) is even'];
  else nodes=[q.prompt,`Valid step: ${q.answer}`,q.explanation];
  html+=flowDiagram(nodes);
 }box.innerHTML=html;if(q.topic==='quantifiers'){const mode=q.prompt.includes('x + y = 0')?'sum':q.prompt.includes('n² = 2')?'integer':q.prompt.includes('x² > 0')?'positive':null;if(mode){const panel=document.createElement('div');box.prepend(panel);mountExplorer(panel,mode);}}
}
