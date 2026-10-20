'use strict';
(() => {
 const $=id=>document.getElementById('code-'+id);
 const examples={python:{sum:'total = 0\nfor number in range(1, 6):\n    total += number\n    print(number, total)\nprint("Final sum:", total)',function:'def square(x):\n    result = x * x\n    return result\n\nanswer = square(7)\nprint(answer)',probability:'import math\n\nn = 12\nk = 3\np = 1 / 6\nprobability = math.comb(n, k) * p**k * (1-p)**(n-k)\nprint("P(X = 3) =", probability)',input:'name = input("Your name: ")\nprint("Hello,", name)'},cpp:{sum:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int total = 0;\n    for (int number = 1; number <= 5; number++) {\n        total += number;\n        cout << number << " " << total << endl;\n    }\n    cout << "Final sum: " << total << endl;\n    return 0;\n}',function:'#include <iostream>\nusing namespace std;\n\nint square(int x) {\n    int result = x * x;\n    return result;\n}\n\nint main() {\n    int answer = square(7);\n    cout << answer << endl;\n    return 0;\n}',input:'#include <iostream>\nusing namespace std;\n\nint main() {\n    int a;\n    int b;\n    cin >> a >> b;\n    cout << "Sum: " << a + b << endl;\n    return 0;\n}'}};
 let language='python',drafts={},worker=null,result=null,index=0,busy=false,playback=null,timeout=null,runSource='';
 function stopPlayback(){clearInterval(playback);playback=null;$('play').textContent='Play steps';}
 function clearTrace(){stopPlayback();$('editor').style.backgroundImage='none';result=null;index=0;$('explanation').textContent='Run your code, then step through what happened.';$('variables').replaceChildren();$('output').textContent='';$('error').textContent='';$('line-map').replaceChildren();$('position').textContent='No run yet';$('selected-line').textContent='';$('slider').max=0;buttons();}
 function buttons(){for(const id of ['prev','next','play','slider'])$(id).disabled=busy||!result?.steps.length;$('prev').disabled=busy||!result?.steps.length||index===0;$('next').disabled=busy||!result?.steps.length||index>=result.steps.length-1;$('run').disabled=busy;$('stop').disabled=!busy;$('language').disabled=busy;$('example').disabled=busy;$('load').disabled=busy;$('editor').readOnly=busy;}
 function gutter(){const count=$('editor').value.split('\n').length;$('gutter').textContent=Array.from({length:count},(_,i)=>i+1).join('\n');$('gutter').scrollTop=$('editor').scrollTop;}
 function showStep(){
  if(!result?.steps.length){$('output').textContent=result?.output||'(No output)';return;}
  const step=result.steps[index];$('position').textContent=`Step ${index+1} of ${result.steps.length} · line ${step.line} · ${step.scope}`;$('explanation').textContent=step.explanation;$('selected-line').textContent=runSource.split('\n')[step.line-1]||'';
  $('output').textContent=step.output||'(No output yet)';$('variables').replaceChildren();
  const vars=Object.entries(step.after||{});for(const [name,value] of vars){const tr=document.createElement('tr');const key=document.createElement('th'),val=document.createElement('td');key.scope='row';key.textContent=name;val.textContent=value;if(step.before?.[name]!==value)tr.className='variable-changed';tr.append(key,val);$('variables').append(tr);}
  if(!vars.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=2;td.textContent='No local variables at this step.';tr.append(td);$('variables').append(tr);}
  $('slider').value=index;const lineHeight=22,scroll=Math.max(0,(step.line-5)*lineHeight);$('editor').scrollTop=scroll;$('gutter').scrollTop=scroll;
  $('editor').style.backgroundImage=`linear-gradient(to bottom, transparent ${(step.line-1)*lineHeight+16}px, #f1cddd99 ${(step.line-1)*lineHeight+16}px, #f1cddd99 ${step.line*lineHeight+16}px, transparent ${step.line*lineHeight+16}px)`;
  buttons();
 }
 function stepBy(delta){stopPlayback();index=Math.max(0,Math.min(result.steps.length-1,index+delta));showStep();}
 function finish(){clearTimeout(timeout);busy=false;worker?.terminate();worker=null;buttons();}
 function run(){
  if(busy)return;if(!$('editor').value.trim()){$('status').textContent='Type some code first.';return;}
  clearTrace();busy=true;runSource=$('editor').value;buttons();$('status').textContent='Preparing runtime… First Python run downloads its runtime and can take a moment.';
  worker=new Worker('code-worker.js?v=1');
  timeout=setTimeout(()=>{worker?.terminate();finish();$('status').textContent='Runtime loading timed out. Check your internet connection and try again.';},90000);
  worker.onmessage=({data})=>{
   if(data.type==='status'){$('status').textContent=data.message;return;}
   if(data.type==='executing'){clearTimeout(timeout);$('status').textContent='Running and recording execution…';timeout=setTimeout(()=>{worker?.terminate();finish();$('status').textContent='Stopped after 10 seconds. Shorten the program or loop and try again.';},10000);return;}
   if(data.type==='failure'){finish();$('status').textContent='Could not run the program.';$('error').textContent=data.message+'\nPython needs internet access to download its runtime. C++ supports a learning subset; see the notes below.';return;}
   if(data.type==='result'){
    result=data.result;$('slider').max=Math.max(0,result.steps.length-1);finish();$('error').textContent=result.error?(result.error.line?'Line '+result.error.line+': ':'')+result.error.message:'';
    $('status').textContent=result.error?'Run stopped. You can inspect the recorded steps.':`Run complete · ${result.steps.length} recorded steps. Variables show the state after each recorded operation.`;
    const executed=new Set(result.steps.map(s=>s.line));for(const item of result.lines){const d=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent=`${item.line}. ${item.code||'(blank)'}${executed.has(item.line)?'':' · not traced'}`;p.textContent=item.explanation;d.append(summary,p);$('line-map').append(d);}
    index=0;showStep();if(!result.steps.length){$('output').textContent=result.output||'(No output)';$('explanation').textContent='No executable steps recorded. Check errors or the line explanations below.';}
   }
  };
  worker.onerror=e=>{finish();$('status').textContent='Runner could not start.';$('error').textContent=e.message||'Refresh and try again.';};
  worker.postMessage({language,code:runSource,input:$('stdin').value});
 }
 function setLanguage(){drafts[language]=$('editor').value;language=$('language').value;clearTrace();$('example').replaceChildren();for(const key of Object.keys(examples[language])){const o=document.createElement('option');o.value=key;o.textContent={sum:'Sum with a loop',function:'A function call',probability:'Binomial probability',input:'Read program input'}[key];$('example').append(o);} $('editor').value=drafts[language]||examples[language].sum;$('filename').textContent=language==='cpp'?'main.cpp':'main.py';$('language-note').textContent=language==='cpp'?'C++ learning interpreter: loops, functions, arrays, basic types, cin/cout. Not a full modern C++ compiler; classes, STL containers, and many libraries are unsupported.':'Python runs locally in your browser. The first run downloads Python over the internet. Standard-library examples work; no pip package installer or graphical windows.';$('status').textContent='Ready when you are.';gutter();}
 $('run').addEventListener('click',run);$('stop').addEventListener('click',()=>{finish();$('status').textContent='Stopped. Your code is unchanged.';});$('language').addEventListener('change',setLanguage);
 $('load').addEventListener('click',()=>{if($('editor').value.trim()&&!confirm('Replace the current editor contents with this example?'))return;clearTrace();$('editor').value=examples[language][$('example').value];gutter();});
 $('prev').addEventListener('click',()=>stepBy(-1));$('next').addEventListener('click',()=>stepBy(1));$('slider').addEventListener('input',()=>{stopPlayback();index=Number($('slider').value);showStep();});
 $('play').addEventListener('click',()=>{if(playback){stopPlayback();return;}if(index>=result.steps.length-1)index=0;$('play').textContent='Pause steps';playback=setInterval(()=>{showStep();if(index>=result.steps.length-1)stopPlayback();else index++;},850);});
 $('last').addEventListener('click',()=>{if(!result)return;stopPlayback();index=Math.max(0,result.steps.length-1);showStep();$('output').textContent=result.output||'(No output)';});
 $('editor').addEventListener('scroll',()=>{$('gutter').scrollTop=$('editor').scrollTop;});$('editor').addEventListener('input',()=>{if(result){clearTrace();$('status').textContent='Code changed. Run again to refresh the trace.';}$('editor').style.backgroundImage='none';gutter();});
 $('editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.target;const a=t.selectionStart,b=t.selectionEnd;t.setRangeText('    ',a,b,'end');t.dispatchEvent(new Event('input'));}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}});
 setLanguage();
})();
