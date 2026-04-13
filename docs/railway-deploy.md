# Railway Deployment Guide

This guide assumes you have never deployed an app before.

## What We Are Deploying

Deploy the web app first.

Why this is the best first step:

- It is the easiest version to launch
- It already contains your ERP dashboard and all requested modules
- It does not require a separate backend service to go live

## Before You Start

You need:

- A GitHub account
- A Railway account
- This project uploaded to a GitHub repository

## 1. Upload The Project To GitHub

If the project is not on GitHub yet:

1. Create a new repository on GitHub
2. Upload the files from this folder
3. Make sure the repository contains the full project, not only `apps/web`

If you need help with GitHub upload, use the existing guide in:

[UPLOAD_TO_GITHUB.md](/Users/faisalzahid/Documents/New project/UPLOAD_TO_GITHUB.md)

## 2. Create A New Railway Project

1. Log in to [Railway](https://railway.app)
2. Click `New Project`
3. Choose `Deploy from GitHub repo`
4. Select your repository

## 3. Add Railway Postgres

For the upgraded practical ERP, you should attach a Postgres database.

1. In Railway, open your project
2. Click `New`
3. Choose `Database`
4. Choose `Postgres`
5. Railway will create a `DATABASE_URL` variable automatically for the project

## 4. Configure The Web Service

Open the Railway service settings and use these values:

- Root Directory: leave blank
- Build Command: `npm install && npm run build:web`
- Start Command: `npm run start:web`

Add this extra environment variable to the web service:

- `AUTH_SECRET`

Use a long random value for `AUTH_SECRET`.

## 5. Deploy

1. Save the settings
2. Click `Deploy`
3. Wait for Railway to finish building

When deployment is complete, Railway will give you a public URL.

## 6. Check That It Works

Open your Railway URL and confirm:

- The ERP dashboard loads
- You can sign in with a default account
- Product, customer, supplier and order sections show records
- Inventory and stock movement sections load correctly
- Invoice and CSV report links open correctly

Default starter accounts:

- `admin / admin123`
- `sales / sales123`
- `warehouse / warehouse123`
- `accounts / accounts123`

Change these passwords in the database before real production use.

You can also test these URLs:

- `/api/health`
- `/api/erp`

Example:

`https://your-app-name.up.railway.app/api/health`

## If Railway Build Or Start Fails

The most common reasons are:

1. Dependencies did not install correctly
2. Build command was entered incorrectly
3. The wrong repository or branch was connected

If it fails, copy the Railway build log and send it to me. I can read the error and tell you exactly what to change.

## What This Version Does Today

This version is a deployable ERP starter with practical business workflows.

It gives you:

- A professional ERP web interface
- Login and user roles
- Database-backed records
- Create forms for core master data and orders
- Invoice pages
- CSV reports
- Stock movement tracking

## What To Build Next

After this deployment, I recommend this order:

1. Change default passwords
2. Add edit and delete flows
3. Add purchase orders and production transactions
4. Add PDF generation and email delivery
5. Add audit logs and approvals
6. Add barcode scanning and handheld warehouse workflows

## Simple Recommendation

Deploy this upgraded version with Railway Postgres connected.

Once it is live, test login, create one product, create one customer, create one sales order, and record one stock movement. That will confirm the live persistence path is working end to end.
