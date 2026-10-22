---
layout: post
title: Which LLM writes the best meeting note? (Meeting-Note-Bench)
tags: essay dev
published: true
excerpt: <p>I ran 8 models on 15 real meetings through the AI meeting note and had three decision models judge them.</p>
---
![Speech bubbles condensing into a single sealed document](/assets/posts/meeting-bench-cover.webp)

## Motivation

I take all my meeting notes in [Anarlog](https://anarlog.so/), which lets me bring my own models from different providers. This benchmark is me checking my ROI: run the same meetings through different models, grade the notes blind, and find out what the extra dollars actually buy.

## What I ran

Fifteen real meetings through the Anarlog's prompt. Eight candidate models, all at high reasoning effort: GPT-6 Luna, Meta's Muse Spark 1.3, Grok 4.6, DeepSeek V4.1 Flash 1017, GLM 5.3 Flash, Claude Haiku 5.5, Gemini 3.8 Flash, and Nemotron 3.5 Super VL. Each wrote one note per meeting. 

Then three judges graded them blind. I used decision models here: Baseten's Mammoth 1, TypeSafe's Jev 1.14, and Perplexity's Decider v1.2. They return calibrated probabilities instead of prose, which makes them cheaper and more consistent than asking a chatbot for a score. 

## Steps

First, generation. Fifteen past meetings from my Anarlog library. Each candidate gets the transcript plus the session title and participants through Anarlog's production enhance template: one note per meeting with 'high' reasoning effort.

Second, absolute scoring. Each judge evaluated every note against six criteria:
- Are all factual claims supported by the transcript?
- Does the note capture the key decisions?
- Does it capture action items, including owners and deadlines where stated?
- Does it cover the important discussion topics?
- Does it attribute statements to the correct speakers?
- Is it concise and well structured?

Third, pairwise ranking. Within each meeting, each judge sees every pair of notes and picks the better one. Model names stay hidden behind blind labels, and all three judges see identical inputs, clipped to a shared budget that fits the smallest judge window.

Fourth, aggregation. Each ballot ranks all eight models per meeting. Ranks convert to Borda points and sum with equal weight per meeting per judge. Costs come from logged tokens times each vendor's list price.

## The leaderboard

| Rank | Model | Borda | Mammoth's | Jev's | Decider's |
| --- | --- | --- | --- | --- | --- |
| 1 | Grok 4.6 | 309 | 1 | 1 | 2 |
| 2 | GPT-6 Luna | 268 | 2 | 2 | 4 |
| 3 | DeepSeek V4.1 Flash 1017 | 248 | 3 | 4 | 3 |
| 4 | GLM 5.3 Flash | 248 | 5 | 3 | 1 |
| 5 | Muse Spark 1.3 Contributor | 209 | 4 | 5 | 5 |
| 6 | Claude Haiku 5.5 | 168 | 6 | 6 | 6 |
| 7 | Nemotron 3.5 Super VL | 89 | 7 | 7 | 8 |
| 8 | Gemini 3.8 Flash | 81 | 8 | 8 | 7 |

The judges agree with each other (pairwise correlation 0.75-0.79), and the bottom of the table is nearly unanimous: Nemotron 3.5 Super VL and Gemini 3.8 Flash lose everywhere.

The absolute scores disagree: they crown GPT-6-Luna, not Grok 4.6. I trust the pairwise. Comparing two notes side by side is a much easier judgment than scoring one in isolation. Human evals prefer comparisons to ratings for the same reason.

## The ballots

Each judge ranked all eight models per meeting. Here are the three full ballots with Borda points:

| Ballot | Mammoth | Jev | Decider |
| --- | --- | --- | --- |
| 1 | Grok 4.6 (112) | Grok 4.6 (103) | GLM 5.3 Flash (99) |
| 2 | GPT-6 Luna (104) | GPT-6 Luna (92) | Grok 4.6 (94) |
| 3 | DeepSeek V4.1 Flash 1017 (78) | GLM 5.3 Flash (84) | DeepSeek V4.1 Flash 1017 (93) |
| 4 | Muse Spark 1.3 Contributor (74) | DeepSeek V4.1 Flash 1017 (77) | GPT-6 Luna (72) |
| 5 | GLM 5.3 Flash (65) | Muse Spark 1.3 Contributor (69) | Muse Spark 1.3 Contributor (66) |
| 6 | Claude Haiku 5.5 (56) | Claude Haiku 5.5 (54) | Claude Haiku 5.5 (58) |
| 7 | Nemotron 3.5 Super VL (32) | Nemotron 3.5 Super VL (36) | Gemini 3.8 Flash (37) |
| 8 | Gemini 3.8 Flash (19) | Gemini 3.8 Flash (25) | Nemotron 3.5 Super VL (21) |

Grok tops two of the three ballots. Decider is the outlier ballot: GLM first, Luna fourth. DeepSeek and GLM tie at 248 Borda, and DeepSeek takes third on the pairwise tiebreak, 56.2 to 54.6.

## Borda vs Cost

![Cost per note versus Borda points with Pareto frontier](/assets/posts/meeting-bench-pareto.svg)

Grok costs $1.08 to write all 120 notes. GPT-6-Luna costs five cents. That is 87% of the winner's Borda at under 5% of the generation cost. The Pareto frontier runs Muse Spark 1.3 Contributor → GPT-6 Luna → Grok 4.6. 

## Limitations

One sample per meeting per model, so reruns will vary. Long transcripts were clipped to fit the smallest judge window, with identical inputs for all three judges. And each model generated only one note per meeting. I have not measured how stable the ranking is across repeated runs. Most importantly the judges are models, not humans.

GLM 5.3 is the disagreement case: first on one ballot, fifth on another. That spread usually means a distinctive style. Some judges reward it, others punish it. Worth a closer look.
