---
layout: post
title: Which LLM writes the best meeting note?
tags: essay ai
published: true
excerpt: <p>I ran 8 models on 15 real meetings through the production Analog prompt and had three decision models judge 1,620 blind comparisons. Grok won. The interesting result is who came second.</p>
---
![Speech bubbles condensing into a single sealed document](/assets/posts/meeting-bench-cover.webp)

Every meeting tool claims the smartest summaries. Nobody publishes numbers.

Transcription is solved. Whisper-class models turn speech into text, and the remaining errors are small. The unmeasured step is what happens next: transcript goes in, meeting note comes out. That step is pure language-model intelligence. Deciding what matters, who committed to what, what gets dropped. Nobody benchmarks it, so I did.

## What I ran

Fifteen real meetings through the production Analog enhance prompt. Eight candidate models, all at high reasoning effort: Grok 4.6, GPT-6 Luna, DeepSeek V4.1 Flash, GLM-5p3 Flash, Claude Haiku 5.5, Gemini 3.8 Flash, Nemotron 3.5 Super, and Meta's Muse Spark. Each wrote one note per meeting. 120 notes.

Then three judges graded them blind. I didn't use chatbots as judges. I used decision models: Baseten's Mammoth, TypeSafe's Jev, and Perplexity's Decider. They return calibrated probabilities instead of prose, which makes them cheaper and more consistent than asking a chatbot for a score. Each judge scored every note on six criteria (360 absolute judgments) and picked the winner of every head-to-head pairing within each meeting (1,260 pairwise judgments). Final ranking is Borda over the per-meeting ranks, equal weight per meeting per judge. The design owes a lot to [Vals AI](https://www.vals.ai).

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

Grok won 7 of the 15 meetings outright and topped two of the three ballots. The judges agree with each other (pairwise correlation 0.75-0.79), and the bottom of the table is nearly unanimous: Nemotron and Gemini Flash lose everywhere.

The absolute scores disagree: they crown GPT-6-Luna, not Grok. I trust the pairwise. Comparing two notes side by side is a much easier judgment than scoring one in isolation. Human evals prefer comparisons to ratings for the same reason.

## The chart that matters

![Cost per note versus Borda points with Pareto frontier](/assets/posts/meeting-bench-pareto.svg)

Grok costs $1.08 to write all 120 notes. GPT-6-Luna costs five cents. That is 87% of the winner's Borda at under 5% of the generation cost. The Pareto frontier runs muse-spark → GPT-6-Luna → Grok. Everything else is dominated: worse notes for more money.

The best note and the shippable note are different answers. The gap between them is twenty-fold in cost for thirteen points of Borda.

## Surprises

Gemini Flash finished last. The small tiers cluster at the bottom. The exception is Meta's Muse Spark: the cheapest model in the field at three cents for the whole run, finished fifth, and sits on the Pareto frontier. It is the only budget model the judges consistently preferred over mid-tier competition.

GLM is the judges' disagreement. Decider ranked it first; Mammoth ranked it fifth. When one ballot loves a model and another is cold, that usually means a distinctive style. Some judges reward it, others punish it. Worth a closer look before shipping.

## Limitations

One sample per meeting per model, so reruns will vary. Long transcripts were clipped to fit the smallest judge window, with identical inputs for all three judges. And the judges are models — human calibration against blind grading is the next step, and I'll update the numbers if humans disagree.

The full tables, per-judge ballots, per-meeting winners, and costs are published alongside this post. No transcript or note text leaves the lab.

The model writing your meeting notes decides what you remember. So which one do you want: the smartest note, or the cheapest one that is almost as good?
