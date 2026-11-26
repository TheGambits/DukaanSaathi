# Dukaan Saathi

**Ab dukaan ka hisaab, sirf bolkar.**

Dukaan Saathi is a simple, voice-first shop management application designed for small Indian retailers. It helps shop owners record sales, manage inventory, track customer credit (Udhaar), and review business activity through an easy-to-use interface.

The project focuses on simple Hindi/Hinglish interactions, clear financial information, and a workflow that works well on both mobile phones and desktop computers.

---

## Contents

- [Why Dukaan Saathi?](#why-dukaan-saathi)
- [Key Features](#key-features)
- [Core Demo Workflow](#core-demo-workflow)
- [Technology](#technology)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Supabase Authentication Setup](#supabase-authentication-setup)
- [Using the Demo Shop](#using-the-demo-shop)
- [Offline and Data Storage](#offline-and-data-storage)
- [Testing and Build](#testing-and-build)
- [Security Notes](#security-notes)
- [Current Scope and Limitations](#current-scope-and-limitations)
- [Contributing](#contributing)

---

## Why Dukaan Saathi?

Many small shop owners still maintain sales, stock, and customer dues in notebooks or through memory. Traditional business software can be difficult to use when it requires extensive typing or accounting knowledge.

Dukaan Saathi aims to make everyday shop management easier. A shopkeeper can enter a transaction by speaking or typing a simple sentence, review the details, and save the bill.

### Designed for

- Kirana and grocery stores
- General merchandise shops
- Small local retailers
- Shop owners who prefer Hindi or Hinglish
- Businesses that need a simple way to track stock and customer dues

## Key Features

### Sales and billing

- Enter transactions using text or supported browser voice recognition.
- Parse common Hindi/Hinglish product and quantity phrases.
- Review parsed transaction details before saving.
- Create bills with item quantities, prices, payment mode, and totals.
- View saved bills and invoice details.
- Share invoice text through WhatsApp.
- Print an invoice or save it as PDF using the browser print dialog.

### Inventory management

- View products, prices, units, and available stock.
- Add or edit products, where supported by the current build.
- Adjust stock quantities.
- Identify products at or below their reorder level.

### Udhaar management

- View customers and their outstanding balances.
- Record customer payments using cash or UPI.
- Review credit and payment activity.
- Prepare a WhatsApp payment reminder when a customer phone number is available.

### Dashboard and analytics

- Review sales and business summaries.
- Track current customer dues and low-stock products.
- Use weekly and monthly views for Udhaar and stock activity where enabled in the current build.

### Authentication

- Supabase email/password authentication is the planned account sign-in provider.
- Login, registration, session handling, logout, and password recovery require valid Supabase project configuration.
- Authentication does not, by itself, synchronize local bills, customers, or inventory to the cloud.

### Responsive interface

- Full-width desktop dashboard with sidebar navigation.
- Responsive tablet layout.
- Mobile layout with compact navigation and touch-friendly controls.
- Hindi/Hinglish-friendly labels and readable text.

---
