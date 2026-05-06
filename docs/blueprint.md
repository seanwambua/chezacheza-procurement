# **App Name**: Chezacheza Procurement Portal (CPP)

## Core Features:

- Purchase Requisition (PR) Submission: Staff can submit internal purchase requests specifying item description, quantity, estimated cost, and the budget line to charge. Each PR is assigned a unique reference number and timestamped on creation.
- Budget Verification & Approval Workflow: Finance can confirm or flag budget availability per budget line. PRs then route through a configurable approval chain (Department Head → Finance Manager → Procurement Committee) with value-based thresholds determining how many sign-offs are required. Rejected PRs return to the requester with a mandatory reason field.
- LPO Generation & Dispatch: Approved PRs auto-generate a formal LPO document carrying a unique LPO number, item details, unit prices, total value, delivery date, payment terms, and authorized signatories. The LPO can be dispatched to the vendor via email or downloaded as a PDF. No LPO can be issued without a prior approved PR (no retrospective LPOs).
- Goods Received Note (GRN) & Fulfillment Tracking: The receiving team logs delivery against the LPO — confirming quantity, quality, and specification match. Discrepancies (short delivery, wrong items, damaged goods) trigger a dispute flag that blocks payment until resolved.
- 3-Way Match & LPO Closure: Finance performs the LPO ↔ GRN ↔ Invoice match before authorizing payment. Matched LPOs are closed and archived. Payment method (EFT, cheque, mobile money) is recorded on closure. LPO number is mandatory on all invoices before the 3-way match proceeds.
- Vendor Database: A searchable register of approved vendors with contact details, category tags, and procurement history per vendor. New vendors can be onboarded with basic KYC fields.
- Item Quality Rating: At GRN stage, the receiving team rates item quality on a 1–5 scale per line item. Ratings are tied to both the vendor and the specific item category.
- Vendor Performance Analysis Tool: A tool that aggregates quality ratings, on-time delivery rates, dispute history, and LPO fulfillment accuracy into a cumulative vendor performance score. Surfaces top and underperforming vendors on the dashboard.
- Procurement Dashboard: Overview of active LPOs by stage, pending approvals, budget utilization per budget line, GRNs awaiting matching, and vendor performance highlights.

## Style Guidelines:

- Primary color: Deep charcoal (#313337)
- Background: Near-white cool grey (#F5F6F8)
- Accent: Desaturated cerulean blue (#639FC4)
- Font: Inter (sans-serif) throughout
- Icons: Simple, clean line-art
- Layout: Grid-based with generous whitespace
- Motion: Subtle, swift transitions on status updates, navigation, and data loading