'use strict';
const subjectRoutes={'math308': 'math-308.html', 'math375': 'math-375.html', 'math328': 'math-328.html', 'math391': 'math-391.html', 'arithmetic': 'arithmetic.html', 'bits': 'bits.html', 'algebra-uno': 'algebra-uno.html', 'free-graph': 'graphing.html'};
if(subjectRoutes[location.hash.slice(1)])location.replace(subjectRoutes[location.hash.slice(1)]);
