'use strict';
const AlgebraUno = (() => {
 const families=['x','y','x²','y²'], coefficients=[1,-2,3,-4,5,-6,7,-8,9];
 const label=c=>c.kind==='term'?`${c.n===1?'':c.n===-1?'−':c.n}${c.family}`:({skip:'Skip',reverse:'Reverse',draw:'Draw 2',wild:'Wild'})[c.kind];
 const term=(n,f)=>n===0?'0':`${n===1?'':n===-1?'−':n}${f}`;
 const legal=(c,top,color)=>c.kind==='wild'||c.kind==='draw'||c.family===color||(c.kind==='term'&&top.kind==='term'&&c.family===top.family);
 function shuffled(cards){const a=[...cards];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function deck(){return shuffled(originalUnoCards.map(c=>({...c})));}
 function create(){const pile=deck(),hands=[pile.splice(0,7),pile.splice(0,7)];const first=pile.findIndex(c=>c.kind==='term');const top=pile.splice(first,1)[0];return {pile,hands,discard:[top],color:top.family,turn:0,winner:null};}
 function draw(s,who,count=1){let got=0;for(let i=0;i<count;i++){if(!s.pile.length&&s.discard.length>1){const top=s.discard.pop();s.pile=shuffled(s.discard);s.discard=[top];}if(!s.pile.length)break;s.hands[who].push(s.pile.pop());got++;}return got;}
 function play(s,who,id,color){if(s.winner!==null||s.turn!==who)return null;const i=s.hands[who].findIndex(c=>c.id===id),c=s.hands[who][i];if(!c||!legal(c,s.discard.at(-1),s.color))return null;if((c.kind==='wild'||c.kind==='draw')&&!families.includes(color))return null;s.hands[who].splice(i,1);s.discard.push(c);s.color=(c.kind==='wild'||c.kind==='draw')?color:c.family;const other=1-who;if(c.kind==='draw')draw(s,other,2);if(!s.hands[who].length)s.winner=who;s.turn=['skip','reverse','draw'].includes(c.kind)?who:other;return c;}
 return {families,label,term,legal,create,draw,play};
})();
(() => {
 const $=id=>document.getElementById('uno-'+id), A=AlgebraUno;
 let state,pending=null,unoCalled=false,aiJob=null,gameId=0;
 const colorName=f=>({x:'Green',y:'Blue','x²':'Red','y²':'Yellow'})[f];
 function cardClass(c){return 'algebra-card original-card';}
 function artwork(node,c){const img=document.createElement('img');img.src=c.art;img.alt=A.label(c);img.draggable=false;node.replaceChildren(img);}
 function note(s){$('message').textContent=s;}
 function log(s){const li=document.createElement('li');li.textContent=s;$('log').prepend(li);while($('log').children.length>8)$('log').lastChild.remove();}
 function render(){
  const top=state.discard.at(-1);$('top').className=cardClass(top);artwork($('top'),top);$('active').textContent=`Active color: ${colorName(state.color)} · ${state.color}`;
  $('computer-count').textContent=`Computer: ${state.hands[1].length} cards${state.hands[1].length===1?' · UNO!':''}`;
  $('turn').textContent=state.winner!==null?(state.winner===0?'You win!':'Computer wins. Try another round?'):state.turn===0?'Your turn':'Computer’s turn…';
  $('hand-title').textContent=`Your hand · ${state.hands[0].length} cards`;$('hand').replaceChildren();
  state.hands[0].forEach(c=>{const b=document.createElement('button');b.type='button';b.className=cardClass(c);artwork(b,c);const playable=A.legal(c,top,state.color);b.disabled=state.winner!==null||state.turn!==0||pending!==null;b.setAttribute('aria-label',`${A.label(c)}, ${c.family?colorName(c.family):'any color'}. ${playable?'Playable':'Does not match; selecting costs a card'}`);b.addEventListener('click',()=>select(c));$('hand').append(b);});
  $('draw').disabled=state.turn!==0||pending!==null||state.winner!==null;$('call').disabled=state.turn!==0||state.hands[0].length!==2||state.winner!==null;$('call').textContent=unoCalled?'UNO called ✓':'Call UNO';
  $('challenge').hidden=!pending||pending.kind!=='term';$('colors').hidden=!pending||!['wild','draw'].includes(pending.kind);
 }
 function schedule(){if(state.winner!==null||state.turn!==1)return;const version=gameId;clearTimeout(aiJob);aiJob=setTimeout(()=>{if(version!==gameId)return;computer();},850);}
 function commit(c,color){
  const prior=state.discard.at(-1);const result=A.play(state,0,c.id,color);if(!result)return;
  if(c.kind==='term'){const sum=prior.kind==='term'&&prior.family===c.family?prior.n+c.n:c.n;log(`You: ${A.label(c)} → ${A.term(sum,c.family)}.`);}else log(`You played ${A.label(c)}${['wild','draw'].includes(c.kind)?' · '+colorName(color):''}.`);
  if(state.hands[0].length===1&&!unoCalled){A.draw(state,0,2);log('Forgot UNO: you draw 2.');note('Call UNO before playing your second-to-last card. You drew 2.');}else note(state.hands[0].length===1?'UNO! One card left.':'Card played.');
  unoCalled=false;pending=null;render();schedule();
 }
 function select(c){
  if(state.turn!==0||pending||state.winner!==null)return;
  if(!A.legal(c,state.discard.at(-1),state.color)){A.draw(state,0);state.turn=1;unoCalled=false;log('You selected a nonmatching card and drew 1.');note('Match the active color or the same variable and exponent. You draw 1 and your turn ends.');render();schedule();return;}
  if(c.kind==='term'){pending=c;const prior=state.discard.at(-1);$('equation').textContent=prior.kind==='term'&&prior.family===c.family?`${A.label(prior)} + (${A.label(c)}) = ?`:`Read this term: ${A.label(c)}. What is its coefficient?`;$('coefficient').value='';note('Enter the coefficient of the simplified term. Example: for −3x², enter −3.');render();$('coefficient').focus();}
  else if(c.kind==='wild'||c.kind==='draw'){pending=c;note('Choose the next color / term family.');render();}
  else commit(c);
 }
 function computer(){
  if(state.turn!==1||state.winner!==null)return;
  const candidates=state.hands[1].filter(c=>A.legal(c,state.discard.at(-1),state.color));
  if(!candidates.length){A.draw(state,1);state.turn=0;log('Computer drew 1 card.');note('Your turn.');render();return;}
  // Prefer an action, then a color represented often in its remaining hand; wild last.
  candidates.sort((a,b)=>(a.kind==='wild')-(b.kind==='wild')||(b.kind!=='term')-(a.kind!=='term'));
  const c=candidates[0],prior=state.discard.at(-1);const color=A.families.reduce((best,f)=>state.hands[1].filter(v=>v.family===f).length>state.hands[1].filter(v=>v.family===best).length?f:best,A.families[0]);
  A.play(state,1,c.id,color);
  if(c.kind==='term'){const sum=prior.kind==='term'&&prior.family===c.family?prior.n+c.n:c.n;log(`Computer: ${A.label(c)} → ${A.term(sum,c.family)}.`);}else log(`Computer played ${A.label(c)}${['wild','draw'].includes(c.kind)?' · '+colorName(color):''}.`);
  if(state.hands[1].length===1)log('Computer calls UNO!');
  note(c.kind==='draw'?'Computer played Draw 2: you draw two cards and lose your turn.':c.kind==='skip'||c.kind==='reverse'?'Computer skips your turn.':'Your turn.');render();schedule();
 }
 $('check').addEventListener('submit',e=>{e.preventDefault();if(!pending||pending.kind!=='term')return;const raw=$('coefficient').value.trim().replace('−','-');if(!/^[+-]?\d+$/.test(raw)){note('Enter a whole-number coefficient, such as 1, −2, or 0.');return;}const top=state.discard.at(-1),sum=top.kind==='term'&&top.family===pending.family?top.n+pending.n:pending.n;if(Number(raw)===sum)commit(pending);else{note(`The coefficient is ${sum}: ${A.term(sum,pending.family)}. You keep your card, draw 1, and your turn ends.`);log('Incorrect reduction: you drew 1.');A.draw(state,0);state.turn=1;pending=null;unoCalled=false;render();schedule();}});
 $('cancel').addEventListener('click',()=>{pending=null;render();note('Choose a card or draw.');});
 A.families.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.className='uno-color family-'+i;b.textContent=`${colorName(f)} · ${f}`;b.addEventListener('click',()=>{if(pending&&['wild','draw'].includes(pending.kind))commit(pending,f);});$('colors').append(b);});
 $('draw').addEventListener('click',()=>{if(state.turn!==0||pending||state.winner!==null)return;A.draw(state,0);state.turn=1;unoCalled=false;log('You drew 1 card.');note('Drawn card added to your hand. Your turn ends.');render();schedule();});
 $('call').addEventListener('click',()=>{unoCalled=true;render();note('UNO ready—now play your second-to-last card.');});
 function reset(){clearTimeout(aiJob);gameId++;state=A.create();pending=null;unoCalled=false;$('log').replaceChildren();note('You go first. Select a card, or draw one.');render();}
 $('new').addEventListener('click',reset);reset();
})();
