---
layout: post
title: Which LLM writes the best meeting note?
tags: essay ai
published: true
excerpt: <p>I ran 8 models on 15 real meetings through the production Anarlog prompt and had three decision models judge 1,620 blind comparisons. Grok won. The interesting result is who came second.</p>
---
![Speech bubbles condensing into a single sealed document](/assets/posts/meeting-bench-cover.webp)

Every meeting tool claims the smartest summaries. Nobody publishes numbers.

Transcription is solved. Whisper-class models turn speech into text, and the remaining errors are small. The unmeasured step is what happens next: transcript goes in, meeting note comes out. That step is pure language-model intelligence. Deciding what matters, who committed to what, what gets dropped. Nobody benchmarks it, so I did.

## Motivation

I take all my meeting notes in [Anarlog](https://anarlog.so/). The setup matters for this post: Anarlog lets me bring my own models from different providers. My notes can run on whatever I plug in, cheap or expensive.

That choice stopped feeling free. Every meeting I was either overpaying for intelligence I couldn't measure or saving money on quality I couldn't see. This benchmark is me checking my ROI: run the same meetings through eight models, grade the notes blind, and find out what the extra dollars actually buy.

## What I ran

Fifteen real meetings through the production Anarlog enhance prompt. Eight candidate models, all at high reasoning effort: Grok 4.6, GPT-6 Luna, DeepSeek V4.1 Flash, GLM-5p3 Flash, Claude Haiku 5.5, Gemini 3.8 Flash, Nemotron 3.5 Super, and Meta's Muse Spark. Each wrote one note per meeting. 120 notes.

Then three judges graded them blind. I didn't use chatbots as judges. I used decision models: Baseten's Mammoth, TypeSafe's Jev, and Perplexity's Decider. They return calibrated probabilities instead of prose, which makes them cheaper and more consistent than asking a chatbot for a score. The design owes a lot to [Vals AI](https://www.vals.ai).

## How it works

Four steps. First, generation. Fifteen real meetings from my Anarlog library. Each candidate gets the transcript plus the session title and participants through the production enhance template: one note per meeting, high reasoning effort. 120 notes.

Second, absolute scoring. Each judge answers six yes/no questions about every note. Is it faithful to the transcript. Are decisions captured. Are action items captured. Is the coverage complete. Is attribution right, who said and committed to what. Is it concise. Each answer is a probability. 360 judgments.

Third, pairwise ranking. Within each meeting, each judge sees every pair of notes and picks the better one. 28 pairs per meeting, 15 meetings, 3 judges: 1,260 judgments. Model names stay hidden behind blind labels, and all three judges see identical inputs, clipped to a shared budget that fits the smallest judge window.

Fourth, aggregation. Each ballot ranks all eight models per meeting. Ranks convert to Borda points and sum with equal weight per meeting per judge. Costs come from logged tokens times each vendor's list price.

## The leaderboard

![Borda leaderboard with per-judge ranks](/assets/posts/meeting-bench-leaderboard.svg)

| Rank | Model | Borda | Mammoth | Jev | Decider |
| --- | --- | --- | --- | --- | --- |
| 1 | grok-4.6 | 309 | 1 | 1 | 2 |
| 2 | gpt-6-luna | 268 | 2 | 2 | 4 |
| 3 | deepseek-v4.1-flash-1017 | 248 | 3 | 4 | 3 |
| 4 | glm-5p3-flash | 248 | 5 | 3 | 1 |
| 5 | muse-spark-1.3-contributor | 209 | 4 | 5 | 5 |
| 6 | claude-haiku-5-5 | 168 | 6 | 6 | 6 |
| 7 | nemotron-3.5-super-vl | 89 | 7 | 7 | 8 |
| 8 | gemini-3.8-flash | 81 | 8 | 8 | 7 |

The judges agree with each other (pairwise correlation 0.75-0.79), and the bottom of the table is nearly unanimous: Nemotron and Gemini Flash lose everywhere.

The absolute scores disagree: they crown GPT-6-Luna, not Grok. I trust the pairwise. Comparing two notes side by side is a much easier judgment than scoring one in isolation. Human evals prefer comparisons to ratings for the same reason.

## The ballots

Each judge ranked all eight models per meeting. Here are the three full ballots with Borda points:

| Ballot | Mammoth | Jev | Decider |
| --- | --- | --- | --- |
| 1 | grok-4.6 (112) | grok-4.6 (103) | glm-5p3-flash (99) |
| 2 | gpt-6-luna (104) | gpt-6-luna (92) | grok-4.6 (94) |
| 3 | deepseek-v4.1-flash-1017 (78) | glm-5p3-flash (84) | deepseek-v4.1-flash-1017 (93) |
| 4 | muse-spark-1.3-contributor (74) | deepseek-v4.1-flash-1017 (77) | gpt-6-luna (72) |
| 5 | glm-5p3-flash (65) | muse-spark-1.3-contributor (69) | muse-spark-1.3-contributor (66) |
| 6 | claude-haiku-5-5 (56) | claude-haiku-5-5 (54) | claude-haiku-5-5 (58) |
| 7 | nemotron-3.5-super-vl (32) | nemotron-3.5-super-vl (36) | gemini-3.8-flash (37) |
| 8 | gemini-3.8-flash (19) | gemini-3.8-flash (25) | nemotron-3.5-super-vl (21) |

Grok tops two of the three ballots. Decider is the outlier ballot: GLM first, Luna fourth. DeepSeek and GLM tie at 248 Borda, and DeepSeek takes third on the pairwise tiebreak, 56.2 to 54.6.

Winners by meeting, 1 through 15: Grok, Muse Spark, DeepSeek, Grok, Luna, Grok, Grok, Grok, GLM, Grok, Luna, GLM, DeepSeek, GLM, Grok. Grok won 7 outright. Nobody else won more than 3.

## Pareto

![Cost per note versus Borda points with Pareto frontier](/assets/posts/meeting-bench-pareto.svg)

Grok costs $1.08 to write all 120 notes. GPT-6-Luna costs five cents. That is 87% of the winner's Borda at under 5% of the generation cost. The Pareto frontier runs muse-spark → GPT-6-Luna → Grok. Everything else is dominated: worse notes for more money.

The best note and the shippable note are different answers. The gap between them is twenty-fold in cost for thirteen points of Borda.

## Surprises

Gemini Flash finished last. The small tiers cluster at the bottom. The exception is Meta's Muse Spark: the cheapest model in the field at three cents for the whole run, finished fifth, and sits on the Pareto frontier. It is the only budget model the judges consistently preferred over mid-tier competition.

GLM is the disagreement case: first on one ballot, fifth on another. That spread usually means a distinctive style. Some judges reward it, others punish it. Worth a closer look before shipping.

## Limitations

One sample per meeting per model, so reruns will vary. Long transcripts were clipped to fit the smallest judge window, with identical inputs for all three judges. And the judges are models — human calibration against blind grading is the next step, and I'll update the numbers if humans disagree.

The full tables, per-judge ballots, per-meeting winners, and costs are published alongside this post. No transcript or note text leaves the lab.

The model writing your meeting notes decides what you remember. So which one do you want: the smartest note, or the cheapest one that is almost as good?
