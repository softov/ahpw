---
title: Bood life
status: done
depends: []
layer: "src/resources/bots"
refs:
  - "[code://src/resources/bots/Bood.tsx](../../../../src/resources/bots/Bood.tsx) - the life a bot lives unless `still`"
  - "[code://src/resources/bots/layer/BotLayer.tsx](../../../../src/resources/bots/layer/BotLayer.tsx) - `arriving`, the transit a dropped bot shows with"
  - file:///github/ahpapp/src/components/Bood.tsx - the timings ported
---

## Objective

A moving bot turns its head and eyes to the pointer, smoothly; stares off or tilts its head now and then; glances; swings its antenna; pops on a mood change; plays a move every few minutes; and shows with a transit where it is dropped.
A person who asked for less motion gets breath and blinks only.

## Files

- `UPDATE: src/resources/bots/Bood.tsx` - one pointer listener for every bot, the life loop, `arrive`.
- `UPDATE: src/resources/bots/layer/BotLayer.tsx` - `arriving` on a drop.

## Steps

1. Done as listed; each head move starts from where the head is, by bood's `ease('ease-out')`.

## Validation

- Measured in a browser: the eye moves every frame of a pointer sweep, at most 0.8 px a frame; the four corners and above and below match Softov's reference frames; a dropped bot shows with a transit; a wander tilts.

## Resume

- Done 2026-10-16; not committed, waiting for Softov's approval.
