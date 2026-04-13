# Frozen Food ERP

This repository now contains a web-based ERP starter for a frozen-food business.

The current version is built to be easy to understand and easy to deploy, especially if you are new to coding. It includes a polished web dashboard with seeded business data for these modules:

- Dashboard
- Inventory
- Products
- Sales Orders
- Purchasing
- Production
- Cold Chain
- Customers
- Suppliers
- HR & Payroll
- Accounting

## What You Can Run Right Now

The main app is the Next.js web app in [apps/web](/Users/faisalzahid/Documents/New project/apps/web).

It already includes:

- An ERP dashboard for frozen-food operations
- Inventory with batch and expiry data
- Product catalog
- Sales, purchasing and production views
- Cold-chain temperature monitoring
- Customer and supplier management views
- HR and payroll summary
- Accounting summary
- API endpoints for health and ERP data

## Project Structure

```text
apps/
  web/        Main ERP web app
  api/        Optional separate Node API starter
  mobile/     Legacy mobile starter, not used for deployment
docs/
  railway-deploy.md
```

## Local Run

From the repository root:

```bash
npm install
npm run dev:web
```

Then open:

`http://localhost:3000`

## API Endpoints

The web app exposes:

- `/api/health`
- `/api/erp`

## Railway Deployment

The easiest path is to deploy only the web app first. The step-by-step guide is here:

[docs/railway-deploy.md](/Users/faisalzahid/Documents/New project/docs/railway-deploy.md)

## Important Note

This is a strong starter ERP foundation, not yet a finished enterprise product. Real production rollout usually adds:

- User login and permissions
- Persistent database records
- Create and edit forms
- Invoice PDF generation
- Barcode or QR batch scanning
- Warehouse handheld workflows
- Approval rules
- Audit logs
- Backup and restore

If you want, the next step after deployment can be turning this starter into a full live system with login, database persistence, and real data entry screens.
