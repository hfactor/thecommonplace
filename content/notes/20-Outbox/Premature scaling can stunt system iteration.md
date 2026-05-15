---
title: Premature scaling can stunt system iteration
date: 2021-08-08
---

Scaling a system before you understand it fixes decisions that should still be flexible. The optimisations that make sense at scale often make small-scale experimentation harder or impossible. You need to learn what the system is before you build for growth. [[Lego-like structure]] is the goal: modular components that can be swapped as understanding develops, rather than a tightly optimised system that can't change without breaking.

The pressure to scale early comes from outside the team, from investors, ambition, fear of being caught unprepared. The more useful question is whether you understand the thing well enough to know what you're scaling. [[Design is scaling]] asks the same from the design side: the infrastructure needs to be right before the complexity it manages can increase. [[Do less]] at the architectural level means resisting the urge to harden things that are still being learned about.
