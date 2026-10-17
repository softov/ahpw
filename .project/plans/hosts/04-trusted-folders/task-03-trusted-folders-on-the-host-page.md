---
title: Trusted folders on the host page
status: done
depends: [task-01-the-answers-sent-on-every-connect.md]
layer: "src/resources/host"
refs:
  - "[code://src/resources/host/Info.tsx](../../../../src/resources/host/Info.tsx) - the host page"
  - file:///github/ahpapp/src/components/HostDetail.tsx - the answers listed, one taken back
---

## Objective

The host page has a Trusted folders section listing each answered folder with Trusted or Not trusted, and a button that forgets the answer.
Forgetting a yes sends the new list, so the host stops trusting the folder; the folder is asked about again next time.

## Files

- `UPDATE: src/resources/host/Info.tsx` - the section.
- `UPDATE: src/style/app.css` - its rows.
- `UPDATE: src/i18n/{en,es,pt}.json` - `trust/host/*`.

## Steps

1. Read the answers from `trustPath(host)`.
2. Forget: push the list without the folder (an empty list as `trustedUris: []`), then drop the answer; a refusal shows the host's words.

## Validation

- By hand: the answers show; forgetting a yes makes the next ACP session in that folder ask again.

## Resume
