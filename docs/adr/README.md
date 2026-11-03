# Architecture Decision Records (ADRs)

This directory documents the significant architectural and technical decisions made for the **Agentic Headless CMS** platform, particularly focusing on the content management studio, visual editing engines, data contracts, and client-side architecture.

---

## ADR Index

| ADR ID                                                  | Title                                                         | Status       | Date       | Area                          |
| :------------------------------------------------------ | :------------------------------------------------------------ | :----------- | :--------- | :---------------------------- |
| [ADR-0001](0001-grapesjs-visual-builder-engine.md)      | Selection of GrapesJS as the Visual Page Builder Engine       | **Accepted** | 2026-08-15 | Visual Studio / Canvas        |
| [ADR-0002](0002-dual-builder-architecture.md)           | Dual-Builder Architecture: Structured Schemas & Visual Canvas | **Accepted** | 2026-09-02 | Content Modeling & Storage    |
| [ADR-0003](0003-client-state-and-contract-envelopes.md) | Client-Side State Architecture & Runtime Contract Validation  | **Accepted** | 2026-09-20 | Networking & State Management |

---

## Format & Guidance

Each ADR follows the standard Lightweight Architecture Decision Record format:

1. **Status**: Proposed, Accepted, Rejected, Deprecated, or Superseded.
2. **Context**: What is the problem we are solving? What forces, requirements, and constraints are at play?
3. **Options Considered**: Alternative approaches evaluated during design.
4. **Decision**: What did we choose to do and why?
5. **Consequences**: Positive outcomes, trade-offs, and mitigations applied.
