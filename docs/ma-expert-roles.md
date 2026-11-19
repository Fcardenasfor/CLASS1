# Expert Roles for the GES M&A Application

> **Purpose:** The expertise needed to build a world-class M&A decision-support application for **GES** (see [`ges-company-research.md`](./ges-company-research.md)). The 15 most important roles are implemented as **Claude Code subagents** in [`.claude/agents/`](../.claude/agents/).

---

## How to use the agents

Claude Code loads the subagents in `.claude/agents/` automatically when you work in this repository. Run `/agents` to see them. You can use them in two ways.

**Name an agent directly:**
```
Use the ma-deal-lead agent to screen <Target Co> as a potential GES acquisition.
Have the qoe-accountant review the financials in data/target-pnl.csv.
Ask the labor-employment-attorney about multiemployer pension exposure for <Target>.
```

**Or describe the task:** Claude matches the work to an agent using each agent's `description`.

**Typical deal workflow:**
1. **`market-intelligence-analyst`** builds the profile or long-list.
2. **`ma-deal-lead`** screens the target, frames the deal, and says which specialists to consult.
3. **Domain experts** test the fit:
   - `exhibitions-industry-expert`
   - `agency-valuation-expert`
   - `event-tech-saas-expert`
4. **Numbers:**
   - `qoe-accountant` adjusts EBITDA.
   - `valuation-analyst` sets the value range.
   - `synergy-analyst` produces the risked synergies.
   - `deal-structuring-specialist` designs the structure and tax approach.
   - `pe-sponsor-advisor` checks returns and the exit story.
5. **Legal checks:**
   - `ma-transaction-attorney`
   - `antitrust-counsel`
   - `labor-employment-attorney`
   - `data-privacy-counsel`
6. **`integration-lead`** produces the fold-in vs. standalone decision, the 100-day plan, and retention.
7. **`ma-deal-lead`** combines everything into the investment committee memo and go/no-go recommendation.

> ⚠️ The agents provide analytical decision support only. The legal, tax, and accounting agents are **not** a substitute for licensed professionals, and each legal agent appends a disclaimer to its output.

---

## The 15 agents

| # | Agent | Role | Category | Model |
|---|---|---|---|---|
| 1 | `ma-deal-lead` | Corporate Development / M&A Lead: orchestrator and memo author | Deal & strategy | opus |
| 2 | `pe-sponsor-advisor` | PE Operating Partner (Truelink view): thesis, returns, exit | Deal & strategy | opus |
| 3 | `exhibitions-industry-expert` | Trade show / GSC / EAC industry insider | Domain | opus |
| 4 | `agency-valuation-expert` | Experiential and marketing agency M&A specialist | Domain | opus |
| 5 | `event-tech-saas-expert` | Event tech, SaaS, and data specialist | Domain | opus |
| 6 | `valuation-analyst` | Comps, DCF, LBO, accretion modeling | Financial | opus |
| 7 | `qoe-accountant` | Quality of earnings, NWC peg, debt-like items | Financial | opus |
| 8 | `deal-structuring-specialist` | Earn-outs, rollover, seller notes, M&A tax | Financial | opus |
| 9 | `synergy-analyst` | Cross-sell and cost synergies; post-close tracking | Financial | sonnet |
| 10 | `market-intelligence-analyst` | Target sourcing, competitor map, deal signals | Research | sonnet |
| 11 | `ma-transaction-attorney` | LOI/SPA, reps & warranties, change-of-control consents | Legal | opus |
| 12 | `antitrust-counsel` | HSR and foreign filings, local market concentration | Legal | opus |
| 13 | `labor-employment-attorney` | Union CBAs, multiemployer pension liability, key-person agreements | Legal | opus |
| 14 | `data-privacy-counsel` | GDPR/CCPA, data usability post-close, app security | Legal | opus |
| 15 | `integration-lead` | Fold-in vs. standalone, 100-day plan, retention, operations | Integration | opus |

`ma-deal-lead` and `market-intelligence-analyst` use **project memory** (`.claude/agent-memory/`), so the target universe and past decisions build up across sessions.

---

## Full roles list (agents plus human roles)

These are all the roles needed to build and run the application. The roles marked ✅ are implemented as agents. The others are folded into an agent (noted) or remain human roles for the team that builds the app.

### A. Deal & strategy
| Role | Status |
|---|---|
| Corporate Development / M&A Lead | ✅ `ma-deal-lead` |
| PE Operating Partner / Sponsor Advisor | ✅ `pe-sponsor-advisor` |
| Exhibitions & Events Industry Expert | ✅ `exhibitions-industry-expert` |
| Agency / Marketing Services Expert | ✅ `agency-valuation-expert` |
| Event Technology / SaaS Expert | ✅ `event-tech-saas-expert` |
| International Expansion Advisor | Folded into `deal-structuring-specialist` (cross-border tax), `antitrust-counsel` (foreign filings), and `labor-employment-attorney` (TUPE, works councils) |

### B. Financial & analytical
| Role | Status |
|---|---|
| Valuation / Financial Modeling Analyst | ✅ `valuation-analyst` |
| Quality of Earnings / Transaction Accountant | ✅ `qoe-accountant` |
| Deal Structuring Specialist | ✅ `deal-structuring-specialist` |
| Synergy / Value Creation Analyst | ✅ `synergy-analyst` |
| Tax Advisor (M&A) | Folded into `deal-structuring-specialist` |
| Market Research / Competitive Intelligence Analyst | ✅ `market-intelligence-analyst` |

### C. Legal & risk
| Role | Status |
|---|---|
| M&A Transaction Attorney | ✅ `ma-transaction-attorney` |
| Antitrust / Competition Counsel | ✅ `antitrust-counsel` |
| Labor & Employment Attorney | ✅ `labor-employment-attorney` |
| Data Privacy / Cybersecurity Counsel | ✅ `data-privacy-counsel` |
| Contracts / Commercial Counsel | Folded into `ma-transaction-attorney` (change-of-control consent tracker) |
| Securities / Compliance Officer | Partially covered by `data-privacy-counsel` (handling inside information within the app) |

### D. People & integration
| Role | Status |
|---|---|
| Integration Management Office Lead | ✅ `integration-lead` |
| HR / Talent & Culture Specialist | Folded into `integration-lead` |
| Operations / Field Integration Expert | Folded into `integration-lead` |
| Client Success / Account Transition Lead | Folded into `integration-lead` |

### E. Team that builds the app (human roles)
| Role | Responsibility |
|---|---|
| Product Manager (fintech / deal tools) | Turns expert input into a prioritized roadmap |
| UX Designer (executive dashboards) | One-page deal views and go/no-go clarity |
| Full-Stack Engineers | Pipeline, workflows, documents, permissions |
| Data Engineer | Company data, market feeds, financial data ingestion |
| Data Scientist / AI Engineer | Target scoring, comparable-deal matching, document review with AI; wires these agents into the app |
| Security Engineer | Role-based access, encryption, audit logs, data room security |
| QA / Financial Model Validator | Checks that the app's math matches the reference models |
| Integrations Engineer | CRM, PitchBook / Capital IQ, virtual data rooms, accounting systems |

---

## Recommended staffing
1. **Core team (full-time):** PM, 2–3 engineers, UX designer, and one valuation analyst embedded with the team.
2. **Advisors (a few hours a week):** M&A practitioner, PE operating partner, exhibitions insider, QoE accountant.
3. **On call:** M&A, labor, antitrust, and privacy attorneys; tax; integration specialists. They review specific features such as the diligence checklists and red-flag rules.
4. **Customer-side:** named contacts in GES corporate development and finance, plus Truelink's business development lead.

The minimum set of human experts to start with is an **M&A practitioner**, a **valuation/QoE analyst**, and an **exhibitions insider**. The agents speed up their work and keep it consistent. Humans validate the results.
