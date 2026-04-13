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

## 3. Configure The Web Service

Open the Railway service settings and use these values:

- Root Directory: leave blank
- Build Command: `npm install && npm run build:web`
- Start Command: `npm run start:web`

Leave environment variables empty for now. This ERP starter does not need secrets for the first deployment.

## 4. Deploy

1. Save the settings
2. Click `Deploy`
3. Wait for Railway to finish building

When deployment is complete, Railway will give you a public URL.

## 5. Check That It Works

Open your Railway URL and confirm:

- The ERP dashboard loads
- The left-side module navigation is visible
- Inventory, sales, cold chain, HR and accounting sections all show data

You can also test these URLs:

- `/api/health`
- `/api/erp`

Example:

`https://your-app-name.up.railway.app/api/health`

## If Railway Build Fails

The most common reasons are:

1. Dependencies did not install correctly
2. Build command was entered incorrectly
3. The wrong repository or branch was connected

If it fails, copy the Railway build log and send it to me. I can read the error and tell you exactly what to change.

## What This Version Does Today

This version is a deployable ERP starter with example frozen-food data.

It gives you:

- A professional ERP web interface
- Frozen-food operations layout
- Dashboard and module screens
- API endpoints for future integrations

## What To Build Next

After your first Railway deployment, I recommend this order:

1. Add login for admin and staff
2. Add a real database so records can be saved permanently
3. Add forms to create products, orders and suppliers
4. Add printable invoices and purchase orders
5. Add role permissions for warehouse, accounts and HR
6. Add reports and export to Excel or PDF

## Simple Recommendation

First deploy this exact version as-is.

Once it is live, send me the Railway link or the deployment error and I will help you with the next step. Then we can convert it from a starter ERP into a full production system piece by piece.
