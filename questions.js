'use strict';
const pick = a => a[Math.floor(Math.random()*a.length)];
const ri = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const setText = a => a.length ? `{${a.join(', ')}}` : '∅';
const mc = (topic,prompt,answer,wrong,explanation,hint) => ({topic,prompt,answer,options:[answer,...wrong],explanation,hint});
const banks = {
logic:[
['What is the negation of P ⇒ Q?','P ∧ ¬Q',['¬P ⇒ ¬Q','¬P ∨ Q','Q ⇒ P'],'An implication fails exactly when P holds and Q fails. Its negation is a conjunction.','Think of a broken promise: the hypothesis happened, but the conclusion did not.'],
['Which statement is equivalent to P ⇒ Q?','¬Q ⇒ ¬P',['Q ⇒ P','¬P ⇒ ¬Q','P ∧ Q'],'An implication and its contrapositive have the same truth table. The converse need not be equivalent.','Reverse the arrow and negate both statements.'],
['Negate: “n is prime and n > 2.”','n is not prime or n ≤ 2',['n is not prime and n ≤ 2','n is prime or n ≤ 2','n is not prime or n < 2'],'De Morgan changes AND to OR; the negation of > is ≤.','Flip the connective and negate each part.'],
['What is the converse of P ⇒ Q?','Q ⇒ P',['¬Q ⇒ ¬P','¬P ⇒ ¬Q','P ⇒ ¬Q'],'The converse exchanges the hypothesis and conclusion without negating either.','Swap the two statements.'],
['Negate P ∨ Q.','¬P ∧ ¬Q',['¬P ∨ ¬Q','P ∧ Q','P ⇒ Q'],'Neither statement may hold: negating OR gives AND of the negations.','Use De Morgan’s law.'],
['P and Q are both true. Is P ∨ Q true?','True',['False'],'Mathematical OR is inclusive: one or both may be true.','Does mathematical OR exclude the case where both hold?'],
['P is false and Q is false. Is P ⇒ Q true?','True',['False'],'With a false hypothesis, the implication is vacuously true. Only true ⇒ false fails.','Recall the only false row in an implication’s truth table.']
],
quantifiers:[
['Negate ∀x ∈ ℝ, x² > 0.','∃x ∈ ℝ, x² ≤ 0',['∀x ∈ ℝ, x² ≤ 0','∃x ∈ ℝ, x² < 0','∃x ∈ ℝ, x² > 0'],'Flip ∀ to ∃ and > to ≤. The witness x = 0 makes the negation true.','“Not everyone” means “someone does not.”'],
['Negate ∃n ∈ ℤ, P(n).','∀n ∈ ℤ, ¬P(n)',['∃n ∈ ℤ, ¬P(n)','∀n ∈ ℤ, P(n)','¬P(0)'],'If no integer satisfies P, every integer fails P.','“There is no” becomes “every one does not.”'],
['Is ∀x ∈ ℝ, ∃y ∈ ℝ, x + y = 0 true?','True',['False'],'For each x, choose y = −x. The later choice can depend on x.','Can you choose a different y for each x?'],
['Is ∃y ∈ ℝ, ∀x ∈ ℝ, x + y = 0 true?','False',['True'],'One fixed y cannot cancel every x. x = 0 requires y = 0, but x = 1 requires y = −1.','One y must work for every x.'],
['To disprove a universal statement, what suffices?','One counterexample',['One confirming example','Ten confirming examples','A witness that satisfies the statement'],'A single failure disproves “for every.” Examples that work cannot prove a general claim.','Look for one failure.'],
['Is ∃n ∈ ℤ, n² = 2 true?','False',['True'],'No integer squares to 2. The domain is ℤ, so √2 is not an allowed witness.','Read the domain before choosing a witness.'],
['Negate: “Both a and b are odd,” for integers a, b.','At least one of a or b is even',['Both a and b are even','Neither a nor b is odd','Exactly one of a or b is even'],'¬(a odd AND b odd) means a even OR b even, including the case where both are even.','Negating AND gives inclusive OR.']
],
proofs:[
['To prove “if n² is even, then n is even” by contrapositive, assume…','n is odd',['n² is even','n is even','n² is odd'],'Assume the negation of the conclusion. Write n = 2k + 1; then n² = 2(2k² + 2k) + 1 is odd.','Contrapositive: assume ¬Q and prove ¬P.'],
['Let a and b be arbitrary even integers. Which opening is valid?','a = 2j and b = 2k, for integers j, k',['a = 2k and b = 2k, for one integer k','a = j² and b = k²','a = 2j + 1 and b = 2k + 1'],'Use separate integer variables. Using the same k would secretly assume a = b.','Two even integers need not be equal.'],
['A proof of P ⇔ Q establishes P ⇒ Q and stops. What is missing?','A proof of Q ⇒ P',['A second proof of P ⇒ Q','A numerical example','Nothing'],'“If and only if” requires both directions. Each direction has its own hypothesis.','A biconditional has two arrows.'],
['A proof that n² − n is even treats only even n. What is missing?','The odd-n case',['The n = 0 case only','The positive-n case only','Nothing'],'Every integer is even or odd. For n = 2k + 1, n² − n = 2(2k² + k), also even.','Are the cases exhaustive?'],
['If a = 2j + 1 and b = 2k + 1, how do we show a + b is even?','a + b = 2(j + k + 1)',['a + b = 2(j + k) + 1','a + b = 2jk + 1','a + b = (j + k)²'],'The sum is twice an integer, which is the definition of even.','Add the two odd forms and factor out 2.'],
['Which exhaustive cases help prove n(n + 1) is even?','n even; n odd',['n positive; n negative','n = 1; n = 2','n divisible by 4; n divisible by 6'],'If n is even, it supplies a factor of 2. If n is odd, n + 1 supplies it. These cases cover all integers.','Choose cases that cover every integer, including 0.'],
['To prove A = B by double containment, what must you show?','A ⊆ B and B ⊆ A',['A ⊆ B only','A ∩ B ≠ ∅','|A| = |B| only'],'Both containments ensure exactly the same elements. Equal cardinalities alone do not give equality.','Every element must belong in both directions.']
],
sets:[
['Is {1} ∈ {1, 2} true?','False',['True'],'The elements are the numbers 1 and 2. The set {1} is a subset, but is not an element here.','Read ∈ as “is an element of.”'],
['Is ∅ ⊆ {∅} true?','True',['False'],'The empty set is a subset of every set: it has no element that violates the subset condition.','A subset condition checks every element of the left-hand set.'],
['How many elements are in {{∅}}?','1',['0','2','3'],'There is one element: the set {∅}. Nested braces do not add extra elements at the outer level.','Count the elements at the outermost level.'],
['What is 𝒫({a, b})?','{∅, {a}, {b}, {a, b}}',['{a, b}','{{a}, {b}}','{∅, a, b}'],'The power set contains all subsets, including ∅ and the whole set.','There are 2² subsets.'],
['Which conditions define a partition of S?','Nonempty cells, covering S, pairwise disjoint',['Covering S only','Pairwise disjoint cells only','Every cell has the same size'],'A partition uses nonempty subsets of S; their union is S and distinct cells never overlap.','There are three conditions.'],
['Which set equals (A ∪ B)ᶜ?','Aᶜ ∩ Bᶜ',['Aᶜ ∪ Bᶜ','A ∩ B','A − B'],'Being outside the union means being outside both sets. Complements use the same universe.','De Morgan swaps union with intersection.'],
['For A₁ ⊆ A₂ ⊆ A₃, what is A₁ ∩ A₂ ∩ A₃?','A₁',['A₃','∅','A₁ ∪ A₃'],'All elements of A₁ belong to every set, and any common element must belong to A₁.','Which member is the smallest?']
]
};
function makeQuestion(topic,level){
 if(topic==='modulo'){
  const d=ri(2,[5,8,12][level-1]),n=ri(0,[20,50,100][level-1]);
  return {topic,prompt:`${n} mod ${d}`,answer:String(n%d),number:n,divisor:d,hint:`Find the largest multiple of ${d} no greater than ${n}, then subtract. The remainder is between 0 and ${d-1}.`,explanation:`${n} = ${d} × ${Math.floor(n/d)} + ${n%d}.`};
 }
 if(topic==='divisibility'){
  const d=ri(2,12),a=ri(-30,100),b=ri(-20,30);
  if(Math.random()<.5)return mc(topic,`Is ${a} ≡ ${b} (mod ${d})?`,(a-b)%d===0?'True':'False',[(a-b)%d===0?'False':'True'],`Check the difference: ${a} − (${b}) = ${a-b}. It ${((a-b)%d===0)?'is':'is not'} divisible by ${d}.`,'Congruent means the modulus divides the difference.');
  return mc(topic,`Does ${d} ∣ ${a}?`,a%d===0?'True':'False',[a%d===0?'False':'True'],`${d} ∣ ${a} means ${a} = ${d}k for an integer k. The quotient ${a}/${d} ${a%d===0?'is':'is not'} an integer.`,'Read the vertical bar as “divides,” not division.');
 }
 if(topic==='logic' && Math.random()<.3){const p=pick([true,false]),q=pick([true,false]);return mc(topic,`P is ${p?'true':'false'} and Q is ${q?'true':'false'}. Is P ⇒ Q true?`,(!p||q)?'True':'False',[(!p||q)?'False':'True'],'An implication is false only when P is true and Q is false.','Check whether the hypothesis is true and the conclusion false.');}
 if(topic==='sets' && Math.random()<.5){
  if(Math.random()<.3){const n=ri(0,6);return {topic,prompt:`If |A| = ${n}, how many elements are in 𝒫(A)?`,answer:String(2**n),hint:'For each element, a subset either includes it or excludes it.',explanation:`There are 2^${n} = ${2**n} subsets, so |𝒫(A)| = ${2**n}.`};}
  const A=[1,2,3,4,5,6].filter(()=>Math.random()<.5),B=[1,2,3,4,5,6].filter(()=>Math.random()<.5),op=pick(['∪','∩','−']);
  const ans=op==='∪'?[...new Set([...A,...B])].sort((a,b)=>a-b):op==='∩'?A.filter(x=>B.includes(x)):A.filter(x=>!B.includes(x));
  return {topic,prompt:`A = ${setText(A)}, B = ${setText(B)}. Find A ${op} B.`,answer:ans,type:'set',hint:op==='∪'?'Include elements in either set, without repeats.':op==='∩'?'Keep only elements in both sets.':'Keep elements of A that are not in B.',explanation:`A ${op} B = ${setText(ans)}. ${op==='∪'?'Union collects either set.':op==='∩'?'Intersection keeps common elements.':'Difference keeps A’s elements outside B.'}`};
 }
 const row=pick(banks[topic]);return mc(topic,...row);
}
