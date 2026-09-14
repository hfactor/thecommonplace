---
title: Ship-Show-Ask
date: 2021-08-11
---

While maintaining the design system, my team follows Ship/Show/Ask, a branching strategy that lets every change carry its own level of review. Ship goes straight to mainline, no PR, no waiting. Show opens a PR but merges without waiting for approval, creates a space for feedback after the fact. Ask opens a PR and waits for input before merging.

Most teams default to Ask for everything, which makes sense when trust is low or the codebase is unfamiliar. But it creates a scaling problem: too many changes waiting on too many reviewers, and the quality of feedback drops as the queue grows.

### Source
- [Ship / Show / Ask – martinfowler.com](https://martinfowler.com/articles/ship-show-ask.html)
