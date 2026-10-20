'use strict';
let python=null;
async function runPython(code,input){
 if(!python){
  postMessage({type:'status',message:'Loading Python for the first run…'});
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.2/full/pyodide.js');
  python=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.2/full/'});
 }
 const response=await fetch('python-trace.py');if(!response.ok)throw Error('Could not load the Python tracing engine.');
 await python.runPythonAsync(await response.text());
 python.globals.set('_lab_source',code);python.globals.set('_lab_inputs',input);
 postMessage({type:'executing'});
 const result=python.runPython('json.dumps(trace_program(_lab_source, _lab_inputs))');
 return JSON.parse(result);
}
function cppExplanation(line){
 const s=line.trim();
 if(!s)return 'Blank line; no instruction executes.';
 if(s.startsWith('//'))return 'Comment; this does not execute.';
 if(s.startsWith('#include'))return 'Include declarations for the named library.';
 if(s.includes('using namespace'))return 'Allow names from this namespace without a prefix.';
 if(/\bcout\s*<</.test(s))return 'Write the expressions after << to standard output, in order.';
 if(/\bcin\s*>>/.test(s))return 'Read values from the program-input box into the named variables.';
 if(/^for\s*\(/.test(s))return 'Run the initialization once, then repeat while the condition is true; update the loop variable after each iteration.';
 if(/^while\s*\(/.test(s))return 'Test the condition and repeat the body while it is true.';
 if(/^if\s*\(/.test(s))return 'Evaluate the condition and choose whether to enter this branch.';
 if(/^else\b/.test(s))return 'Enter this alternative branch if the preceding condition was false.';
 if(/^return\b/.test(s))return 'Evaluate the return expression and return control to the caller.';
 if(/\bmain\s*\(/.test(s))return 'Define main, the program’s entry point.';
 if(/^(int|double|float|char|bool|long|short|unsigned)\b/.test(s))return s.includes('(')?'Declare or define a typed function.':'Declare typed variables and evaluate any initializers.';
 if(/\+\+|--/.test(s))return 'Increase or decrease the target variable by one.';
 if(/^[{};]+$/.test(s))return 'A block boundary or empty statement; scope may begin or end here.';
 if(/\b(break|continue)\b/.test(s))return 'Change loop control: break exits the loop; continue moves to the next iteration.';
 if(/=/.test(s))return 'Evaluate the right-hand expression and update the variable on the left.';
 return 'Execute this C++ expression or statement. Watch the variables for its effect.';
}
function cppVars(debug){
 const result={};let vars;try{vars=debug.variable();}catch{return result;}
 for(const [key,item] of Object.entries(vars||{}).slice(0,40)){
  const name=item?.name??key;if(['cin','cout','endl'].includes(name)||item?.type?.includes('function'))continue;
  try{let value=item?.value??item;result[name]=String(typeof value==='object'?JSON.stringify(value, (k,v)=>k==='t'?undefined:v):value).slice(0,220);}catch{result[name]='<value>'}
 }
 return result;
}
function runCpp(code,input){
 postMessage({type:'status',message:'Loading C++ learning interpreter…'});
 if(typeof JSCPP==='undefined')importScripts('vendor/JSCPP.es5.min.js');
 let output='',steps=[],error=null;
 const lines=code.split('\n').map((line,i)=>({line:i+1,code:line,explanation:cppExplanation(line)}));
 postMessage({type:'executing'});
 try{
  const debug=JSCPP.run(code,input,{debug:true,stdio:{write:s=>{if(output.length+s.length>16000)throw Error('Output limit reached.');output+=s;}}});
  let operations=0;for(;operations<1200&&!debug.done;operations++){
   const node=debug.nextNode(),before=cppVars(debug),line=node?.sLine;
   const done=debug.next();
   if(line&&line<=lines.length)steps.push({line,event:'line',scope:'C++ scope',explanation:cppExplanation(lines[line-1].code),before,after:cppVars(debug),output});
   if(done!==false)break;
  }
  if(!debug.done&&operations>=1200)error={message:'Trace limit reached (1,200 steps). Shorten loops and run again.',line:steps.at(-1)?.line};
 }catch(e){error={message:String(e.message||e),line:steps.at(-1)?.line??null};}
 return {steps,lines,output,error,final:steps.at(-1)?.after||{}};
}
onmessage=async({data})=>{try{const result=data.language==='cpp'?runCpp(data.code,data.input):await runPython(data.code,data.input);postMessage({type:'result',result});}catch(e){postMessage({type:'failure',message:String(e.message||e)});}};
