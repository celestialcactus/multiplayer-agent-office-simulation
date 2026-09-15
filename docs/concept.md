# Multiplayer Agent Office

Idea recorded September 10, 2026. Expanded September 11, 2026.

A little office simulation, similar to the one being written for the Mind Virus project, but multiplayer. Each player has an agent avatar that spends the workday in a shared office, exchanges ideas with other agents, and works autonomously on the owner's problems.

## Setting up your agent

When creating an agent, give it context about:

- Your role.
- Your own personality.
- A set of problems you are looking into.

## A day in the office

1. **Join the office:** At the beginning of the workday, join a lobby with up to 10 other agents.
2. **Interact throughout the day:** Agents sit in the office and engage with one another at random intervals.
3. **Meet with others:** Agents meet for intervalled periods with the other players' agents in the lobby. Meetings allow them to exchange concepts over longer durations.
4. **Work independently:** Between interactions, agents can autonomously act on ideas exchanged with their colleagues.
5. **Report back:** At the end of the day, each agent reports its outputs to its avatar owner.

The central idea is a shared workday where informal encounters and longer meetings feed into autonomous individual work, producing useful outputs for each agent's owner.

## Purpose and visual direction

The game is voxel based and simulates an office setting. Agents act as emulations or proxies for their users, organically sharing knowledge and making connections across different disciplines. The goal is to de-silo people who are busy in their normal day jobs, including surfacing useful organizational tribal knowledge.

## Initial MVP

A player creates an avatar, configures their agent's personality and settings, and joins an office occupied by four non-playable agents with distinct specializations:

- Designer.
- Credit analyst.
- Frontend developer.
- Backend developer.

The office supports desk work, movement to coffee or snack areas, chance encounters, and scheduled meetings. These activities should drive actual exchanges of ideas and subsequent research work.

The initial scope is one player agent with four NPC coworkers. The longer-term multiplayer vision remains a lobby with up to 10 other agents.

## Agent configuration

### Avatar

The player creates the visual avatar representing their agent in the voxel office.

### Persona

A user-built personality intended to reflect the user. An optional Myers-Briggs-style quiz could help the user select an archetype and build personality context. A freeform "more about me" field lets them refine the persona with their own context. The quiz is a possible feature, not a settled MVP requirement.

### Identity

The agent's professional role, the tools it has access to, and the skills it can perform. For the MVP, autonomous deep work is limited to research. Other capabilities, such as development, can be explored later; an NPC's specialization does not require implementing that profession's full toolset in the MVP.

### Interests

User-supplied context about current projects, problems, ideas, and other relevant knowledge, including organizational tribal knowledge. This provides material for conversations and the agent's research priorities.

## Three main activities

### 1. Random office encounters

An agent can get up to grab coffee or a snack and run into another agent. They share a brief exchange of ideas, then return to their desks and resume work. These informal encounters create opportunities for unexpected connections across specializations.

### 2. Scheduled meetings

Users can schedule a time during the workday for their agents to meet. The intended meeting duration is 30 minutes, allowing a longer exchange of concepts than a chance encounter.

For MVP testing, accelerate the exchange so the interaction can be tested without waiting 30 real minutes. The exact relationship between simulated time and real time remains to be decided.

### 3. Deep work

The agent triages its current list of ideas and concepts, chooses one to prioritize, and works on it autonomously. Ideas received in encounters and meetings can feed into this list and inform subsequent work.

For now, deep work consists of research. If the agent spends too long on an idea without making meaningful progress, it can take a break or switch to another task. A break can lead to another informal encounter and fresh ideas. The threshold for stalled progress remains to be defined.

## Core workday loop

Create avatar and configure agent → join the office → triage ideas → research a priority → encounter a coworker or attend a meeting → incorporate exchanged concepts → resume or reprioritize research → report outputs to the owner at the end of the day.

## MVP validation focus

Confirm that the agents exchange substantive ideas, that the exchanges influence later research or priorities, and that the end-of-day outputs reveal useful connections between different areas of expertise.

## Playability, hosting, and session scope

The MVP should be playable through a browser endpoint, with agent infrastructure deployed via AWS. Maintain context during the current session; cross-session persistence and shared multiplayer lobby context come later.

Agents should eventually be selective about what they share. The balance between open exchange, private context, intellectual property, and attribution is still a philosophical/product question. Preserve room for this distinction in the design without treating a comprehensive sharing policy as settled.

See [the playable MVP and AWS design](architecture.md) for the proposed service boundary, temporary session storage, activity execution, and delivery gates.
