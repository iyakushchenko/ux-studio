# Quinn (QA) — Chat MCP prove criteria



**Status:** **PROVEN** — React `chat` PAGE FINAL PASS HARD-GREEN (2026-07-20).  

**Updated:** 2026-07-20  

**Screen:** `chat` (Make child 10 retired · scenario `site-pilot-chat`)  

**Refs:** [STUDIO_AUTO_RULES.md](../../../product/STUDIO_AUTO_RULES.md) R11 · [URL.md](../../../shell/URL.md) · `studioMcpPageProbe.ts` · [UMA_FIDELITY_CHAT_2026-07-19.md](./UMA_FIDELITY_CHAT_2026-07-19.md) · [FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md](./FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md)



---



## Hard refuse rules



| Rule | FAIL when |

|------|-----------|

| **No false PROVEN** | Recipe green alone without Uma PROVEN + Final Pass stamp |

| **Overlay visible every step** | Agent testing BR panel absent/hidden on any probe step |

| **Scroll-into-view** | Interact before target is in view |

| **`reload: false`** | Page probe uses reload (R1 teardown / URL fight) |

| **R11 fixed localhost + reuse tab** | Not `http://localhost:5173/` / `127.0.0.1:5173`; `new_page` when Studio tab exists |

| **Teardown clean** | Sticky `&modal=` / overlay DOM after settle |



---



## Prove URLs (canonical — R11)



```

http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=off&experience=agentic

```



---



## Probe entry



```js

await window.__studioRunMcpPageProbe?.({ screenId: "chat", reload: false })

```



---



## Expanded matrix (`chatMcpProbeSteps`) — 2026-07-20



| Id | Expect |

|----|--------|

| `overlay-arm` | BR panel visible |

| `chat-host` | `<main class="chat" data-studio-react-screen="chat">` |

| `chat-make-retired` | Make retired; 1 live summary |

| `chat-site-pilot-bar` | Logo + Contact Support + Rate |

| `chat-landmarks` | summary + query + reply + uxds-link |

| `chat-composer-*` | dock / textarea / send / mic hover / chip hover |

| `chat-cta-hover` | commerce CTA hover |

| `chat-helpful-hover` | reply Yes/No hover + conversation residual copy |

| `chat-layout-rhythm` | §0b 40 / 864 / 64 / 438 / `#dbebf5` |

| `chat-disclaimer` | mistakes copy + support link |

| `chat-footer-hidden` | footer mount height ≈0 |

| `chat-cta-frame-sweep` | ≥2 reply frames with commerce CTAs (`cjm=off`) |

| `chat-below-fold-reveal` | scroll host `.chat__column` |

| `chat-composer-scroll-pad` | pad clears dock |

| `chat-motion-owner` | ≥2 Motion frames |

| `url-screen` | `screen=chat` |



---



## Live evidence log (2026-07-20)



| Field | Value |

|-------|-------|

| Tip | v0.0.60 ship |

| Recipe | **PASS** — 20/20 `__studioRunMcpPageProbe({ screenId:"chat", reload:false })` |

| Playback adjunct | Site Pilot→Chat type-in PASS; thinking-start/end on r0 |

| Whole-page PROVEN | **YES** — Uma PROVEN |

| PAGE FINAL PASS | **HARD-GREEN** |



**Quinn status:** recipe **PASS** · Final Pass **HARD-GREEN**.


