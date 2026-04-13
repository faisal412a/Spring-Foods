# Frozen Food ERP

This repository now contains a web-based ERP for a frozen-food business.

The current version is designed to stay understandable while also being practical enough for daily use. It now includes:

- Login and user roles
- Railway-friendly Postgres persistence
- Product, customer, supplier and order forms
- Invoice pages and CSV report exports
- Stock movement tracking with inventory updates
- Frozen-food dashboard and cold-chain monitoring

## What You Can Run Right Now

The main app is the Next.js web app in [apps/web](/Users/faisalzahid/Documents/New project/apps/web).

It already includes:

- An ERP dashboard for frozen-food operations
- Product, customer and supplier master data
- Sales order entry with invoice pages
- Stock movement ledger and inventory rollup
- Role-based access for admin, sales, warehouse and accounts
- Cold-chain temperature monitoring
- API endpoints for health, ERP data and CSV exports

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
- `/api/reports/sales.csv`
- `/api/reports/inventory.csv`

## Railway Deployment

The easiest path is to deploy only the web app first. The step-by-step guide is here:

[docs/railway-deploy.md](/Users/faisalzahid/Documents/New project/docs/railway-deploy.md)

## Important Note

For practical use in Railway, add these environment variables:

- `DATABASE_URL`
- `AUTH_SECRET`

If `DATABASE_URL` is missing, the app falls back to demo mode and disables permanent record creation.

## Important Note

This is a practical ERP starter, not yet a finished enterprise rollout. Real production rollout usually adds:

- Password reset and email verification
- Field-level edit history
- Dedicated PDF generation service
- Barcode or QR batch scanning
- Warehouse handheld workflows
- Approval rules
- Audit logs
- Backup and restore
