'use strict';
function checkStepValue(value,step){if(step.type==='set'){const parsed=parseSet(value);return parsed!==null&&JSON.stringify(parsed)===JSON.stringify([...step.answer].sort((a,b)=>a-b));}const n=parseProbability(value);return Number.isFinite(n)&&Math.abs(n-step.answer)<=.000051;}
function mountStepChecks(q,form){let box=document.getElementById(form.id+'-steps');if(box)box.remove();let checks=q.checks;
 if(!checks&&q.topic==='modulo'&&q.number!==undefined)checks=[{label:'Number of complete groups (quotient)',answer:Math.floor(q.number/q.divisor)},{label:'Largest full multiple below or equal to the number',answer:Math.floor(q.number/q.divisor)*q.divisor}];
 if(!checks?.length)return;box=document.createElement('details');box.id=form.id+'-steps';box.className='step-checks';const summary=document.createElement('summary');summary.textContent='Check my working · optional';box.append(summary);const help=document.createElement('p');help.textContent='Enter intermediate values, then check them. These checks don’t affect your score. Use 4+ decimal places or fractions; comma-separated values for sets.';box.append(help);const inputs=[];
 checks.forEach((step,i)=>{const row=document.createElement('div');row.className='step-line';const label=document.createElement('label');label.textContent=step.label;const input=document.createElement('input');input.id=box.id+'-'+i;input.autocomplete='off';label.htmlFor=input.id;row.append(label,input);box.append(row);inputs.push(input);});const button=document.createElement('button');button.type='button';button.textContent='Check steps';const output=document.createElement('div');output.className='step-result';output.setAttribute('role','status');output.setAttribute('aria-live','polite');button.addEventListener('click',()=>{output.textContent=checks.map((step,i)=>`${step.label}: ${!inputs[i].value.trim()?'not entered yet':checkStepValue(inputs[i].value,step)?'correct ✓':'needs another look — check the formula and rounding'}`).join('\n');});box.append(button,output);form.before(box);}
const renderBridge=question;question=function(){renderBridge();mountStepChecks(current,document.getElementById('form'));};
const renderProbability=probabilityNext;probabilityNext=function(){renderProbability();mountStepChecks(probState.q,document.getElementById('prob-form'));};
const renderNumerical=numericalNext;numericalNext=function(){renderNumerical();mountStepChecks(numState.q,document.getElementById('num-form'));};
mountStepChecks(current,document.getElementById('form'));mountStepChecks(probState.q,document.getElementById('prob-form'));mountStepChecks(numState.q,document.getElementById('num-form'));
for(const [button,form,done] of [['next','form',()=>finished],['prob-next','prob-form',()=>probState.done],['num-next','num-form',()=>numState.done]])document.getElementById(button).addEventListener('click',()=>{if(done()){const box=document.getElementById(form+'-steps');if(box)box.hidden=true;}});
banks.quantifiers.push(
 ['Negate ∀x ∈ ℝ, ∃y ∈ ℝ, x < y.','∃x ∈ ℝ, ∀y ∈ ℝ, x ≥ y',['∀x ∈ ℝ, ∃y ∈ ℝ, x ≥ y','∃x ∈ ℝ, ∃y ∈ ℝ, x ≥ y','∃x ∈ ℝ, ∀y ∈ ℝ, x > y'],'Flip each quantifier in place; negate x < y to x ≥ y.','Move the negation inward one quantifier at a time.'],
 ['Is ∀x ∈ ℝ, ∃y ∈ ℝ, y > x true?','True',['False'],'For any real x, choose y = x + 1.','The later y can depend on x.'],
 ['Is ∃y ∈ ℝ, ∀x ∈ ℝ, y > x true?','False',['True'],'For any proposed y, x = y + 1 is a counterexample.','Can any real number exceed every real number?']
);
banks.proofs.push(
 ['A proof begins with n² odd to prove n odd. Which implication is it proving?','n² odd ⇒ n odd',['n odd ⇒ n² odd','n² even ⇒ n even','n even ⇒ n² even'],'The assumed condition is the hypothesis; the target is the conclusion.','Identify what is assumed and what must be shown.'],
 ['To show 3 ∣ (a + b), given 3 ∣ a and 3 ∣ b, which step works?','Write a = 3r, b = 3s; then a + b = 3(r + s)',['Write a = b = 3r','Write 3 = ar and 3 = bs','Check a = 3 and b = 6 only'],'r + s is an integer, so the sum is divisible by 3.','Unpack divisibility with separate integer witnesses.']
);
banks.sets.push(
 ['Which ordered pair belongs to {1,2} × {a,b}?','(2, a)',['(a, 2)','{2, a}','(3, a)'],'The first coordinate must be in {1,2}, the second in {a,b}.','Order and coordinate membership both matter.'],
 ['If |A| = 3 and |B| = 4, what is |A × B|?','12',['7','16','81'],'Every first coordinate can pair with each second coordinate: 3 × 4 = 12.','Apply the multiplication principle.']
);
