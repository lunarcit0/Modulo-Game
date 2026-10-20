"""Small deterministic explanations plus a real CPython execution trace."""
import ast, sys, io, json, types, traceback

class TraceLimit(BaseException):
    pass

def explain_node(node):
    text = lambda value: ast.unparse(value)[:180]
    if isinstance(node, (ast.Assign, ast.AnnAssign)):
        targets = node.targets if isinstance(node, ast.Assign) else [node.target]
        value = getattr(node, 'value', None)
        return 'Evaluate ' + (text(value) if value else 'the annotation') + '; bind the result to ' + ', '.join(text(t) for t in targets) + '.'
    if isinstance(node, ast.AugAssign):
        return 'Update ' + text(node.target) + ' using ' + type(node.op).__name__ + ' and ' + text(node.value) + '.'
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return 'Define function ' + node.name + '(' + ', '.join(a.arg for a in node.args.args) + '). Its body runs only when called; default arguments are evaluated now.'
    if isinstance(node, ast.Return):
        return 'Evaluate ' + (text(node.value) if node.value else 'None') + ' and return it to the caller.'
    if isinstance(node, (ast.For, ast.AsyncFor)):
        return 'Take the next item from ' + text(node.iter) + ', assign it to ' + text(node.target) + ', and run the loop body; stop when the iterable ends.'
    if isinstance(node, ast.While):
        return 'Test ' + text(node.test) + '. Repeat the body while it is true.'
    if isinstance(node, ast.If):
        return 'Test ' + text(node.test) + ' and select the matching branch.'
    if isinstance(node, ast.Import):
        return 'Import ' + ', '.join(a.name for a in node.names) + ' so its objects can be used.'
    if isinstance(node, ast.ImportFrom):
        return 'Import ' + ', '.join(a.name for a in node.names) + ' from ' + str(node.module) + '.'
    if isinstance(node, ast.Expr):
        if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
            return 'A string used as documentation (a docstring at the start of a module, function, or class).'
        if isinstance(node.value, ast.Call):
            return 'Call ' + text(node.value.func) + ' with the supplied arguments.' + (' Write its output below.' if text(node.value.func) == 'print' else '')
        return 'Evaluate this expression: ' + text(node.value) + '.'
    if isinstance(node, ast.ClassDef):
        return 'Define class ' + node.name + ' by executing its class body.'
    if isinstance(node, ast.Break): return 'Leave the nearest loop.'
    if isinstance(node, ast.Continue): return 'Skip to the next loop iteration.'
    if isinstance(node, ast.Pass): return 'Do nothing; this is a placeholder.'
    if isinstance(node, ast.Raise): return 'Raise an exception, transferring control to an appropriate handler.'
    if isinstance(node, ast.Try): return 'Run the try block; handle matching exceptions if one occurs.'
    if isinstance(node, (ast.With, ast.AsyncWith)): return 'Enter the context manager, run the body, then clean up the context.'
    if isinstance(node, ast.Assert): return 'Check ' + text(node.test) + '; raise AssertionError if it is false.'
    return 'Execute this ' + type(node).__name__ + ' statement according to Python rules.'

def trace_program(source, inputs=''):
    steps, overview, pending = [], [], {}
    namespace = {'__name__': '__main__'}
    error, last_module = None, {}
    def display(value, depth=0):
        t = type(value)
        if t in (int, float, bool, str, type(None), complex):
            if t is int and value.bit_length() > 2000: return '<large integer>'
            return repr(value)[:220]
        if t in (list, tuple, set, dict) and depth < 2:
            if t is dict:
                items = list(value.items())[:8]
                return '{' + ', '.join(display(k,depth+1)+': '+display(v,depth+1) for k,v in items) + (', …' if len(value)>8 else '') + '}'
            left,right = ('[',']') if t is list else ('(',')') if t is tuple else ('{','}')
            vals=[]
            for i,v in enumerate(value):
                if i==8: break
                vals.append(display(v,depth+1))
            return left + ', '.join(vals) + (', …' if len(value)>8 else '') + right
        if isinstance(value, types.ModuleType): return '<module ' + value.__name__ + '>'
        if isinstance(value, types.FunctionType): return '<function ' + value.__name__ + '>'
        return '<' + t.__name__ + ' object>'
    def snapshot(scope):
        return {k: display(v) for k,v in list(scope.items())[:60] if not k.startswith('__')}
    class Output(io.StringIO):
        def write(self, value):
            if self.tell()+len(value)>16000: raise TraceLimit('Output limit reached (16,000 characters).')
            return super().write(value)
    output = Output()
    saved_out, saved_err, saved_in = sys.stdout, sys.stderr, sys.stdin
    descriptions = {}
    try:
        tree = ast.parse(source, filename='<user_code>')
        for node in ast.walk(tree):
            if isinstance(node, ast.stmt):
                descriptions[node.lineno] = explain_node(node)
        for number,line in enumerate(source.splitlines(),1):
            stripped=line.strip()
            explanation=descriptions.get(number)
            if not explanation:
                explanation = 'Blank line; no instruction executes.' if not stripped else 'Comment; Python does not execute it.' if stripped.startswith('#') else 'Continuation or part of the surrounding statement.'
            overview.append({'line':number,'code':line,'explanation':explanation})
        def finish(frame):
            index=pending.pop(id(frame),None)
            if index is not None:
                steps[index]['after']=snapshot(frame.f_locals)
                steps[index]['output']=output.getvalue()
        def tracer(frame,event,arg):
            if frame.f_code.co_filename!='<user_code>': return None
            if len(steps)>=1200: raise TraceLimit('Trace limit reached (1,200 steps). Shorten loops and run again.')
            if event=='line':
                finish(frame)
                before=snapshot(frame.f_locals)
                steps.append({'line':frame.f_lineno,'event':'line','scope':frame.f_code.co_name,'explanation':descriptions.get(frame.f_lineno,'Evaluate this part of the surrounding statement.'),'before':before,'after':before,'output':output.getvalue()})
                pending[id(frame)]=len(steps)-1
            elif event=='return':
                finish(frame)
                if frame.f_code.co_name!='<module>':
                    values=snapshot(frame.f_locals)
                    steps.append({'line':frame.f_lineno,'event':'return','scope':frame.f_code.co_name,'explanation':'Return to the caller with '+display(arg)+'.','before':values,'after':values,'output':output.getvalue()})
            return tracer
        compiled=compile(tree,'<user_code>','exec')
        sys.stdout=sys.stderr=output
        sys.stdin=io.StringIO(inputs)
        sys.settrace(tracer)
        exec(compiled,namespace,namespace)
    except BaseException as exc:
        sys.settrace(None)
        tb=traceback.extract_tb(exc.__traceback__)
        line=next((t.lineno for t in reversed(tb) if t.filename=='<user_code>'),getattr(exc,'lineno',None))
        error={'message':type(exc).__name__+': '+str(exc),'line':line}
    finally:
        sys.settrace(None)
        sys.stdout,sys.stderr,sys.stdin=saved_out,saved_err,saved_in
    return {'steps':steps,'lines':overview,'output':output.getvalue(),'error':error,'final':snapshot(namespace)}
