// Only these fixed behavioral cues may leave private profile context.
// Never copy personal facts or arbitrary instructions into shared prompts.
const cues=[
 [/rebel|challeng\w* convention|nonconform|contrarian/i,'Challenge the default assumption respectfully; offer a concrete alternative rather than agreeing automatically.'],
 [/pragmatic|practical|tangible|prototype|hands.on/i,'Move toward a small tangible prototype; name what to build and how to test it.'],
 [/evidence|analyt|skeptic|data.driven/i,'Ask what evidence would change the decision; seek counterexamples and distinguish hypotheses from findings.'],
 [/strategic|strategy|prioriti|ruthless/i,'Prioritize the highest-impact uncertainty; explain the tradeoff and propose a clear next decision.'],
 [/creative|imaginative|explor|curious/i,'Explore an unexpected connection while explaining why it applies to this problem.'],
 [/empathetic|empathy|compassion|listen/i,'Consider the affected person’s experience and ask a thoughtful clarifying question.'],
 [/cautious|careful|risk.averse|measured/i,'Identify downside and uncertainty before committing; suggest a reversible experiment.'],
 [/direct|blunt|concise/i,'Speak directly and concisely, with a clear recommendation and rationale.']
];
export function workingStyle(description=''){return cues.filter(([pattern])=>pattern.test(description)).map(([,cue])=>cue).slice(0,5)}
