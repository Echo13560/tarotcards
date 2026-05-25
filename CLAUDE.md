# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**星辰塔罗 (Celestial Arcana)** — A pure-frontend PWA tarot app. No build system, no package.json, no framework. Zero runtime dependencies (Tailwind CSS loaded from CDN only).

To preview: `python3 -m http.server 8080` from project root, then open `http://localhost:8080`.

## Architecture

Single-page app consisting of one large `index.html` (~460KB, ~8600 lines) plus 12 external JS modules in `data/`.

### Module loading order (critical — script tags in `<head>`)
1. `data/tarot-cards.js` → `window.TAROT_CARDS` (78 cards array)
2. `data/spreads.js` → `window.TAROT_SPREADS` (7 spread configs)
3. `data/tarot-engine.js` → `window.TarotEngine` (draw logic, reading generation)
4. `data/app-features.js` → `window.AppFeatures` (card rendering SVG, achievements)
5. `data/enhancements.js` → `window.TarotHistoryPlus`, `window.TarotMemory` (history/RAG)
6. `data/sound-haptic.js` → `window.TarotSFX`
7. `data/ai-reader.js` → `window.TarotAI` (OpenAI-compatible streaming)
8. `data/pet-system.js` → `window.TarotPet`
9. `data/daily-card.js` → `window.TarotDaily`
10. `data/share-poster.js` → `window.TarotPoster` (Canvas poster generation)
11. `data/history-plus.js` → `window.TarotHistoryPlus` (favorite/filter/stats)
12. `data/memory-rag.js` → `window.TarotMemory` (long-term memory index)

`window.TAROT_CARDS` and `window.TarotEngine` are checked before `init()` is called.

### Key patterns in index.html

**Global state object** (`state`, line ~3624): holds `selectedSpread`, `selectedCards`, `question`, `currentStep`, `currentPage`, `relationshipMode`, `drawnPool`, `history`, `profile`, `lastRecord`, `lastReading`, etc.

**Helper selectors**: `$('#id')` wraps `document.querySelector`, `$$('.class')` wraps `querySelectorAll`.

**Page switching**: `showPage(pageId)` hides all `.page` elements and shows the target. `navigateTo(name)` is a higher-level wrapper that also handles FAB visibility. Pages: `page-home`, `page-divination`, `page-history`, `page-relationship-result`.

**Divination flow** (4 steps):
- Step 1 (`#step-1`): Question input
- Step 2 (`#step-2-meditate`): Breathing meditation
- Step 3 (`#step-3-draw`): Shuffle → cut deck → card fan selection
  - `startShuffleAndDeal()` → `startCutDeck()` → `proceedToCardFan()` → `generateCardDeck()`
  - `generateCardDeck()` draws a pool of 14–20 cards, creates `.fan-card` elements with CSS rotate transform
  - `selectFanCard(cardEl)` handles card click: pushes to `state.selectedCards`, enables `#to-step-4` when full
- Step 4 (`#step-4-reading`): Results rendered by `renderReading()`

**Relationship mode** (`state.relationshipMode = true`):
- Triggered from `#open-relationship-btn` → modal → `#relationship-start-btn`
- Sets `state.selectedSpread = 'relationship'` (7 cards), then calls `goToStep(3)` + `proceedToCardFan()`
- On confirm (`#to-step-4`): calls `generateRelationshipReading()` → `renderRelationshipResult()` → `showPage('page-relationship-result')`
- Result page: `#page-relationship-result` with `#rel-result-back`, `#rel-result-share`, `#rel-result-save`, `#rel-result-share-btn2`

**Card fan CSS**: `.fan-card` elements use `transform-origin: 50% 200px` to fan from a virtual pivot point below the container. Each card stores its base transform in `--base-transform` CSS variable for hover/select animations.

**Event binding**: `bindEvents()` (line ~5996) called from `init()`. The relationship modal buttons are bound in a separate `DOMContentLoaded` listener (line ~8393). There are two `DOMContentLoaded` listeners total.

### TarotEngine API
`window.TarotEngine` exposes: `detectTopic`, `drawCards`, `getReversalRate`, `generateSpreadReading`, `generateFollowupAnswer`, `TOPIC_LABEL`, `getTopicEmoji`. **There is no `renderDeck` method** — card deck rendering is handled internally by `generateCardDeck()` in `index.html`.

### Data persistence
- `localStorage`: history (`tarot_history`), profile, pet state, AI config, journal, settings
- `sessionStorage`: divination draft for interruption recovery (`tarot_divination_draft_v1`)
- Draft auto-expires after 30 minutes; restored via modal prompt on next visit
