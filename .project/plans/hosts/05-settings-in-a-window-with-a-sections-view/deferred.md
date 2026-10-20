---
title: Settings in a window, with a sections view beside the fields and the JSON - deferred
date: 2026-10-19
---

Each waits on scena or on ahpd.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A plugin's section repeats its name in the object's own header (`AGENT-CLAUDE` under *agent-claude*) | the form cannot yet draw an object section without its header | a scena change, then unplanned |
| A reset enum shows *Select...* | ahpd's daemon keys carry no `default` in the schema | ahpd |
| The restart banner (`_meta["ahpd.restartNeeded"]`) | not part of this plan | unplanned |
