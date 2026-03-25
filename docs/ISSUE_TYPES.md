# 📋 Issue Types Reference

## Overview

The Document Intelligence Engine detects **32 distinct issue types** across **28 analysis layers**. This document provides a comprehensive reference for all issue types, their meanings, detection methods, and implementation status.

> **📋 See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for implementation status and known issues.**

## Issue Categories

### Category Summary

| Category | Issue Types | Layer Group | Detection Status |
|----------|-------------|-------------|------------------|
| BASE | 12 | Layers 1-10 | ✅ Mostly implemented |
| SYSTEM CORE | 5 | Layers 11-15 | ⚠️ AI-only (needs parser) |
| FORMAL SYSTEM | 13 | Layers 16-28 | ⚠️ AI-only (needs parser) |
| META | 2 | All layers | ✅ Implemented |

---

## BASE ISSUE TYPES (Layers 1-10)

### 1. Hallucination

**Layer**: Factual & Evidence (Layer 5)  
**Agent**: Fact Checker  
**Severity Range**: Critical → Info  
**Detection Status**: ⚠️ Partial (rule-based for statistics/citations)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `fabrication` | Completely made-up information | "The API returns 99.9% uptime" (no evidence) | ❌ AI-only |
| `unsourced_statistic` | Numbers without citations | "50% of users prefer..." | ✅ Rule-based |
| `unsupported_claim` | Definitive statement without proof | "This is the best approach..." | ❌ AI-only |
| `outdated_info` | Information that may be outdated | References to old versions without context | ❌ AI-only |
| `missing_citation` | Citations referenced but not provided | "See [1]" but no reference section | ✅ Rule-based |

---

### 2. Contradiction

**Layer**: Contradiction & Consistency (Layer 1)  
**Agent**: Contradiction Detector  
**Severity Range**: Critical → Warning  
**Detection Status**: ✅ Implemented (rule-based + AI)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `direct` | Explicit conflict between statements | "API is RESTful" vs "API is GraphQL" | ✅ AI |
| `indirect` | Implied conflict requiring inference | "Always use HTTPS" vs "HTTP endpoint available" | ✅ AI |
| `hidden` | Contradiction requiring deeper analysis | Multiple state descriptions that conflict | ✅ AI |
| `numerical` | Different numbers for same fact | "500 users" vs "1000 users" | ❌ Not implemented |
| `negation` | One claim negates another | "Always async" vs "Never async" | ✅ Rule-based + AI |

---

### 3. Consistency

**Layer**: Contradiction & Consistency (Layer 1)  
**Agent**: Consistency Checker  
**Severity Range**: Warning → Info  
**Detection Status**: ✅ Implemented (rule-based)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `terminology_drift` | Same concept, different terms | "endpoint" vs "route" vs "URL" | ✅ Rule-based |
| `definition_drift` | Term redefined across document | "User" defined differently in sections | ✅ Rule-based |
| `naming_convention` | Inconsistent naming patterns | `camelCase` vs `snake_case` mixed | ✅ Rule-based |
| `capitalization` | Inconsistent capitalization | "API" vs "api" vs "Api" | ✅ Rule-based |
| `date_format` | Different date formats | "2024-01-15" vs "01/15/2024" | ❌ Not implemented |
| `version_format` | Inconsistent versioning | "v1.0" vs "1.0.0" vs "version 1" | ❌ Not implemented |

---

### 4. Structural

**Layer**: Structural & Organizational (Layer 3)  
**Agent**: Structure Analyzer  
**Severity Range**: Warning → Info  
**Detection Status**: ✅ Implemented (rule-based)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `hierarchy_skip` | Heading level jump | H1 → H3 (skipping H2) | ✅ Rule-based |
| `multiple_h1` | More than one H1 heading | Two # Main Title in same doc | ❌ Not implemented |
| `empty_section` | Section with no content | Heading followed by next heading | ✅ Rule-based |
| `broken_link` | Internal link to non-existent anchor | `[Intro](#introduction)` but no anchor | ✅ Rule-based |
| `poor_organization` | Missing logical structure | Long doc without sections | ❌ Not implemented |
| `improper_ordering` | Sections in wrong order | Conclusion before Introduction | ❌ Not implemented |

---

### 5. Logical

**Layer**: Logical Integrity (Layer 2)  
**Agent**: Logic Checker  
**Severity Range**: Critical → Info  
**Detection Status**: ✅ Implemented (rule-based + AI)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `circular_reasoning` | Conclusion proves premise | "A is true because A is true" | ✅ Rule-based + AI |
| `non_sequitur` | Conclusion doesn't follow | "It's fast, therefore secure" | ✅ AI |
| `false_dichotomy` | Only two options presented | "Either A or B" (ignoring C, D) | ✅ AI |
| `hasty_generalization` | Broad claim from limited data | "This test passed, so it always works" | ✅ AI |
| `false_causality` | Incorrect cause-effect | "A happened, then B, so A caused B" | ✅ AI |
| `missing_premise` | Hidden assumption | Conclusion requires unstated fact | ✅ AI |
| `appeal_to_authority` | Authority cited without evidence | "Expert says so, therefore true" | ✅ AI |
| `slippery_slope` | Chain of unlikely events | "A will lead to Z" | ✅ AI |
| `overgeneralization` | Universal claim without proof | "Always use X" / "Never use Y" | ✅ Rule-based |
| `begging_the_question` | Premise assumes conclusion | "X is best because it's optimal" | ✅ AI |

---

### 6. Functional

**Layer**: Functional & Practical (Layer 6)  
**Agent**: Functional Validator  
**Severity Range**: Critical → Info  
**Detection Status**: ⚠️ AI-only

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `impossibility` | Step that cannot work | "Compile Python to machine code" | ⚠️ AI-only |
| `unrealistic` | Impractical requirement | "Process 1TB in 1ms" | ⚠️ AI-only |
| `missing_step` | Gap in workflow | Jump from step 1 to step 4 | ⚠️ AI-only |
| `broken_workflow` | Disconnected sequence | Steps that don't connect | ⚠️ AI-only |
| `dependency_gap` | Missing prerequisite | "Run B" but A required first | ⚠️ AI-only |
| `resource_conflict` | Competing requirements | "Use X" and "Don't use X" | ⚠️ AI-only |

---

### 7. Semantic

**Layer**: Semantic & Clarity (Layer 4)  
**Agent**: Semantic Analyzer, Terminology Checker, Assumption Detector  
**Severity Range**: Warning → Info  
**Detection Status**: ⚠️ Partial (rule-based for synonyms)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `ambiguity` | Multiple possible meanings | "The API handles requests" (which API?) | ⚠️ AI-only |
| `vagueness` | Lacks specificity | "Some time later" / "Various methods" | ⚠️ AI-only |
| `undefined_term` | Technical term not defined | "Use OAuth" without explaining OAuth | ⚠️ AI-only |
| `polysemy` | Same word, different meanings | "Run the process" (execute vs. procedure) | ⚠️ AI-only |
| `context_drift` | Topic change without transition | Sudden topic switch | ⚠️ AI-only |
| `misleading_phrasing` | Could be misinterpreted | "Not unlike X" (confusing double negative) | ⚠️ AI-only |
| `incomplete_explanation` | Concept mentioned but not explained | "See CAP theorem" without explanation | ⚠️ AI-only |
| `implicit_assumption` | Unstated prerequisite | "Just run the script" (assumes setup done) | ⚠️ AI-only |
| `pronoun_ambiguity` | "It/this/that" unclear | "It handles the request" (what is "it"?) | ⚠️ AI-only |
| `scope_ambiguity` | "All/some/most" unclear | "Users can access..." (which users?) | ⚠️ AI-only |
| `synonym_drift` | Multiple synonyms for same concept | "endpoint/route/path/URL" mixed | ✅ Rule-based |

---

### 8. Temporal

**Layer**: Temporal & State (Layer 7)  
**Agent**: Temporal Analyzer  
**Severity Range**: Critical → Info  
**Detection Status**: ⚠️ AI-only

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `timeline_contradiction` | Events in wrong order | "After release, we planned" | ⚠️ AI-only |
| `sequence_error` | Steps out of logical order | Step 5 before step 2 | ⚠️ AI-only |
| `state_error` | Invalid state transition | Active → Deleted (skipping Inactive) | ⚠️ AI-only |
| `version_inconsistency` | Contradictory version info | "v2.0 released" vs "v1.5 is latest" | ⚠️ AI-only |
| `causality_break` | Effect before cause | "Error fixed" before "Error reported" | ⚠️ AI-only |
| `tense_confusion` | Future/past mixed incorrectly | "Will have been completed" | ⚠️ AI-only |

---

### 9. Completeness

**Layer**: Completeness & Coverage (Layer 9)  
**Agent**: Completeness Checker  
**Severity Range**: Warning → Info  
**Detection Status**: ✅ Partial (rule-based for TODO/FIXME)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `missing_edge_case` | Edge case not covered | "For all inputs" (but negative numbers?) | ⚠️ AI-only |
| `missing_scenario` | Use case not addressed | Only happy path documented | ⚠️ AI-only |
| `incomplete_workflow` | Steps end abruptly | Steps 1-5 of 10-step process | ⚠️ AI-only |
| `missing_constraint` | Limitations not stated | "Works for any size" (actually limited) | ⚠️ AI-only |
| `missing_definition` | Key term not defined | Technical jargon without explanation | ⚠️ AI-only |
| `uncovered_requirement` | Feature without docs | API endpoint exists but not documented | ⚠️ AI-only |
| `partial_explanation` | Concept partially covered | "Use caching" without how/when | ⚠️ AI-only |
| `gap_in_reasoning` | Logical jump | A → C without explaining B | ⚠️ AI-only |
| `todo_marker` | Incomplete content marker | TODO/FIXME/TBD markers | ✅ Rule-based |

---

### 10. Intent

**Layer**: Intent & Goal Alignment (Layer 10)  
**Agent**: Intent-Scope Checker  
**Severity Range**: Critical → Info  
**Detection Status**: ⚠️ AI-only

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `goal_misalignment` | Content doesn't serve purpose | Tutorial without steps | ⚠️ AI-only |
| `requirement_mismatch` | Doesn't match requirements | Spec says X, doc says Y | ⚠️ AI-only |
| `output_objective_mismatch` | Deliverable vs. goal conflict | "Quick reference" is 50 pages | ⚠️ AI-only |
| `scope_creep` | Beyond intended scope | API doc includes unrelated topics | ⚠️ AI-only |
| `unclear_objective` | Purpose is ambiguous | Doc goal not stated | ⚠️ AI-only |
| `conflicting_goals` | Objectives contradict | "Simple" and "comprehensive" both claimed | ⚠️ AI-only |
| `ineffective_solution` | Solution doesn't solve problem | Fix doesn't address root cause | ⚠️ AI-only |
| `irrelevant_content` | Content doesn't serve purpose | History lesson in API reference | ⚠️ AI-only |

---

### 11. Architectural

**Layer**: Architectural & System (Layer 8)  
**Agent**: N/A (combined with Quantitative)  
**Severity Range**: Critical → Info  
**Detection Status**: ⚠️ AI-only

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `component_misalignment` | Components don't match | Frontend expects different API | ⚠️ AI-only |
| `interface_mismatch` | Interface definitions conflict | Type A vs Type B | ⚠️ AI-only |
| `layer_violation` | Architecture layer crossed | UI calling database directly | ⚠️ AI-only |

---

### 12. Quantitative

**Layer**: Architectural & System (Layer 8)  
**Agent**: Quantitative Checker  
**Severity Range**: Critical → Info  
**Detection Status**: ✅ Partial (rule-based for units)

| Sub-Type | Description | Example | Detection |
|----------|-------------|---------|-----------|
| `calculation_error` | Math doesn't add up | "50% + 50% = 100%" (but different bases) | ⚠️ AI-only |
| `unit_inconsistency` | Mixed units | "100ms" then "0.5 seconds" | ✅ Rule-based |
| `statistical_error` | Wrong statistical interpretation | "Average of averages" | ⚠️ AI-only |
| `scale_mismatch` | Unrealistic magnitude | "Process 10^12 records/second" | ⚠️ AI-only |
| `percentage_error` | Percentages don't sum | "80% + 30% = 100%" | ⚠️ AI-only |
| `precision_issue` | Inappropriate precision | "99.99999% uptime" (unverifiable) | ⚠️ AI-only |

---

## SYSTEM CORE ISSUE TYPES (Layers 11-15)

> **✅ Detection Status**: SYSTEM CORE issues now have rule-based detection with enhanced parser components.

### 13. Invariant Violation

**Layer**: Execution Invariant Safety (Layer 11)  
**Agent**: Execution Invariant Validator  
**Severity Range**: Critical  
**Detection Status**: ✅ Enhanced (Rule-based + AI)

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `bypass_path` | Invariant can be bypassed | Alternative execution path skips validation |
| `missing_step` | Required step omitted | Preconditions not checked |
| `parallel_leak` | Parallel execution violates invariant | Race condition in state update |

---

### 14. Authority Breach

**Layer**: Authority Boundary Integrity (Layer 12)  
**Agent**: Authority Boundary Analyzer  
**Severity Range**: Critical  
**Detection Status**: ✅ Enhanced (Rule-based + AI)

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `permission_isolation` | Permission boundaries crossed | User role accesses admin resource |
| `privilege_escalation` | Direct privilege escalation | User gains admin via API |
| `runtime_host_leak` | Runtime escapes host boundaries | Sandbox breakout possible |

---

### 15. Nondeterminism

**Layer**: Deterministic Execution (Layer 13)  
**Agent**: Determinism Analyzer  
**Severity Range**: Critical → Warning  
**Detection Status**: ✅ Enhanced (Rule-based patterns)

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `nondeterministic_retry` | Retry with random backoff | Exponential backoff with jitter |
| `time_based_branch` | Decision based on current time | `if Date.now() > X` |
| `random_seed` | Random number generation | `Math.random()` in decision path |
| `async_race` | Non-deterministic async ordering | Promise.race with multiple sources |
| `replay_divergence` | Execution not reproducible | Different output on same input |

---

### 16. Governance Gap

**Layer**: Governance Enforcement (Layer 14)  
**Agent**: Governance Analyzer  
**Severity Range**: Critical  
**Detection Status**: ✅ Enhanced (Rule-based + AI)

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `missing_validation` | Validation step absent | No input validation on endpoint |
| `bypass_channel` | Alternative path bypasses rules | Admin API skips validation |
| `override_path` | Override capability exists | Admin can disable safety checks |
| `unenforced_constraint` | Constraint declared but not enforced | "Must be unique" not validated |

---

### 17. PSG Integrity

**Layer**: PSG Consistency (Layer 15)  
**Agent**: World-Model Consistency Analyzer  
**Severity Range**: Critical  
**Detection Status**: ✅ Enhanced (Rule-based + AI)

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `graph_inconsistency` | Graph structure invalid | Orphaned nodes, broken edges |
| `snapshot_isolation` | Snapshot isolation violated | Read-after-write inconsistency |
| `mutation_ordering` | Mutations in wrong order | Child created before parent |

---

## FORMAL SYSTEM ISSUE TYPES (Layers 16-28)

> **✅ Detection Status**: FORMAL SYSTEM issues now have enhanced detection with rule-based extraction components.

### 18. Invariant Bypass

**Layer**: Invariant Closure (Layer 16)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based)

Mutation path not covered by invariants.

---

### 19. Mutation Illegality

**Layer**: State Mutation Legitimacy (Layer 17)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based state machine)

State transition not in allowed state machine.

---

### 20. Privilege Escalation

**Layer**: Authority Leak Detection (Layer 18)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based)

Indirect path to gain elevated permissions.

---

### 21. Unknown Entity

**Layer**: Closed-World Enforcement (Layer 19)  
**Severity**: Warning  
**Detection**: ✅ Enhanced (Rule-based entity verification)

Reference to entity not in known universe.

---

### 22. Replay Divergence

**Layer**: Replay Fidelity (Layer 20)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based patterns)

Execution cannot be reproduced identically.

---

### 23. Agent Conflict

**Layer**: Multi-Agent Consistency (Layer 21)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based overlap detection)

Different agents make conflicting decisions.

---

### 24. Sync Violation

**Layer**: Execution-PSG Sync (Layer 22)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based)

Runtime state diverges from graph state.

---

### 25. Recovery Failure

**Layer**: Recovery & Failure Semantics (Layer 23)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based)

Recovery path doesn't restore valid state.

---

### 26. Race Condition

**Layer**: Concurrency Safety (Layer 24)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based patterns)

Concurrent access without proper synchronization.

---

### 27. Enforcement Gap

**Layer**: Boundary Enforcement (Layer 25)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based)

Rule declared but not actively enforced.

---

### 28. Simulation Drift

**Layer**: Simulation Soundness (Layer 26)  
**Severity**: Warning  
**Detection**: ✅ Enhanced (Rule-based)

Simulation diverges from actual behavior.

---

### 29. Convergence Failure

**Layer**: Goal Convergence (Layer 27)  
**Severity**: Critical  
**Detection**: ✅ Enhanced (Rule-based)

Process may not terminate or oscillates.

---

### 30. Semantic Drift

**Layer**: Semantic-Execution Alignment (Layer 28)  
**Severity**: Warning  
**Detection**: ✅ Enhanced (Rule-based)

Execution behavior diverges from stated intent.

---

## META ISSUE TYPES

### 31. Adversarial

**Layer**: Varies  
**Agent**: Adversarial Analyzer, Stress-Test Generator  
**Severity Range**: Info  
**Detection Status**: ⚠️ AI-only

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `counter_argument` | Valid counter-argument exists | "X is best" (but Y works better for Z) |
| `edge_case_vulnerability` | Edge case breaks claim | "Always works" (except when X) |
| `unstated_assumption` | Hidden assumption exposed | Claim requires assumption A |
| `boundary_condition` | Claim fails at boundaries | Works for X, but not X+1 |
| `stress_test` | Generated test case | Boundary condition test |

---

### 32. Meta

**Layer**: Varies  
**Agent**: Cross-Agent Conflict Resolver, Severity Scoring Engine, Final Meta Judge  
**Severity Range**: Info → Critical  
**Detection Status**: ✅ Implemented

| Sub-Type | Description | Example |
|----------|-------------|---------|
| `agent_disagreement` | Agents disagree on finding | Agent A says critical, Agent B says info |
| `severity_adjustment` | Severity recalculated | Boosted from warning to critical |
| `final_judgment` | Overall assessment | "Critical issues require attention" |

---

## Severity Levels

### Critical 🔴
- Direct contradictions
- Fabricated information
- Broken functionality
- Major logical errors
- Execution safety violations
- Authority boundary breaches

### Warning 🟡
- Inconsistencies
- Missing information
- Potential issues
- Quality concerns
- Determinism concerns
- Governance gaps

### Info 🔵
- Style suggestions
- Best practice reminders
- Minor improvements
- Documentation gaps
- Adversarial test cases

---

## Confidence Scoring

Each issue includes a confidence score (0.0 - 1.0):

| Range | Interpretation |
|-------|---------------|
| 0.9 - 1.0 | Very high confidence, multiple agents agree |
| 0.8 - 0.9 | High confidence, clear evidence |
| 0.7 - 0.8 | Good confidence, may need review |
| 0.6 - 0.7 | Moderate confidence, human review recommended |
| Below 0.6 | Low confidence, marked as uncertain |

---

## Summary Table

| Category | Types | Fully Implemented | Partial (AI-only) | Not Implemented |
|----------|-------|-------------------|-------------------|-----------------|
| BASE | 12 | 6 | 6 | 0 |
| SYSTEM CORE | 5 | 5 | 0 | 0 |
| FORMAL SYSTEM | 13 | 10 | 3 | 0 |
| META | 2 | 1 | 1 | 0 |
| **TOTAL** | **32** | **22** | **10** | **0** |

---

**This reference helps understand the comprehensive issue detection capabilities of the system. See [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) for improvement roadmap.**
