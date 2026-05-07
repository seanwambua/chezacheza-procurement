# Chezacheza Procurement Portal (CPP)

An enterprise-grade procurement management system designed for Chezacheza, providing strategic control over organizational commitments, departmental budgets, and vendor relationships.

## 🚀 Overview

The CPP Portal streamlines the entire procurement lifecycle—from initial internal requisition to final goods receipt and vendor payment tracking. It ensures fiscal responsibility through automated quarterly budget enforcement and multi-tier approval workflows.

## ✨ Key Features

- **Dashboard & Analytics**: Real-time visualization of fiscal health, total spend actuals, and vendor quality metrics.
- **Purchase Requisitions**: Multi-item internal request system with budget-line validation.
- **Approval Pipeline**: Transparent multi-tier authorization workflow (Manager → Finance → Admin).
- **LPO Generation**: Official Local Purchase Order dispatch with documented payment and delivery terms.
- **Goods Received (GRN)**: Verification system for deliveries with quality rating and dispute management.
- **Budget Governance**: Rolling quarterly allocations with automated spending pauses when caps are reached.
- **Vendor Database**: Performance tracking, on-time delivery rates, and dispute history.
- **RBAC (Role-Based Access Control)**: Tailored interfaces and permissions for Admin, Manager, Finance, and Staff roles.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) (Radix Primitives)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with Persistence)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router (Portal & Landing)
├── components/        # Reusable UI & Layout components
├── hooks/             # Custom React hooks
├── lib/               # Business logic, types, and state stores
└── ai/                # Genkit AI configurations and flows
```

## 🛡️ User Roles & Permissions

- **Admin**: Full system governance, user management, and global audit.
- **Manager**: Departmental approval authority and budget oversight.
- **Finance**: Allocation management, payment verification, and fiscal analysis.
- **Staff**: Procurement drafting and goods receipt verification.

## 🌓 Interface Options

The portal features a highly customizable interface:
- **Collapsed/Expanded Sidebar**: Defaulting to a focused, collapsed view.
- **Detailed/Simple Views**: Toggle between data-dense professional views or high-level summaries.
- **Dark Mode**: Full system-wide support for dark and light themes.

---
*© 2025 Chezacheza. All rights reserved.*
