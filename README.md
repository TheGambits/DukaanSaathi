# Dukaan Saathi

**Ab dukaan ka hisaab, sirf bolkar.**

Dukaan Saathi is a simple, voice-first shop management application designed for small Indian retailers. It helps shop owners record sales, manage inventory, track customer credit (Udhaar), and review business activity through an easy-to-use interface.

The project focuses on simple Hindi/Hinglish interactions, clear financial information, and a workflow that works well on both mobile phones and desktop computers.

> **Project status:** Hackathon MVP / active development. Check the current application build for the exact availability of each feature. Supabase is intended for user authentication. Business records remain in the app's local storage unless cloud data synchronization is separately implemented.

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

## Core Demo Workflow

The main demonstration uses this transaction:

```text
2 kilo chawal aur 1 tel, Ramesh ko udhaar
```

Demo values:

| Detail | Value |
|---|---:|
| Rice price | ₹60/kg |
| Oil price | ₹200/litre |
| Rice quantity | 2 kg |
| Oil quantity | 1 litre |
| Bill total | ₹320 |
| Ramesh's opening Udhaar | ₹820 |
| Amount paid | ₹0 |
| Ramesh's updated Udhaar | ₹1,140 |

Expected stock changes:

- Rice stock decreases by 2 kg.
- Oil stock decreases by 1 litre.
- If oil starts at 3 litres with a reorder level of 2 litres, it reaches the low-stock threshold after the sale.

The user should be able to review the parsed transaction and confirm it before the bill is saved.

---

## Technology

The project is designed around the following technologies. The exact dependencies in the repository's `package.json` are authoritative.

| Area | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Authentication | Supabase Auth (`@supabase/supabase-js`) |
| Local data | Browser storage / IndexedDB, depending on the configured app build |
| Voice input | Browser Web Speech API where supported |
| Charts | Recharts, if included in the current build |
| Language | Hindi/Hinglish and English interface text |

---

## Project Structure

A typical project layout looks like this. Your repository may use slightly different file names or folders.

```text
dukaan-saathi/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   │   ├── parser.ts
│   │   ├── billing.ts
│   │   ├── storage.ts
│   │   └── supabase.ts
│   ├── context/
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js (LTS version recommended)
- npm
- A modern browser such as Chrome or Edge
- A Supabase project for real account authentication

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd dukaan-saathi
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the Vite project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use the values from your own Supabase project. Do not commit `.env.local` to GitHub.

If Supabase has not been configured yet, follow the setup section below. The application may show an authentication configuration message until valid credentials are supplied.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

### 5. Create a production build

```bash
npm run build
```

If the repository defines different scripts, use the commands listed in its `package.json`.

---

## Supabase Authentication Setup

Dukaan Saathi uses Supabase Auth for account authentication when configured.

### 1. Create a Supabase project

Go to [Supabase](https://supabase.com/) and create a project.

### 2. Copy the project credentials

In your Supabase project, open the project connection/API settings and copy:

- Project URL
- Publishable key (or the public `anon` key for projects using the older key format)

Add them to `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

### 3. Enable email authentication

In the Supabase dashboard:

1. Open **Authentication**.
2. Open **Providers** or **Sign In / Providers**.
3. Enable **Email**.
4. Choose whether email confirmation is required for new accounts.

### 4. Configure redirect URLs

In the Supabase authentication URL settings, add the local development URL:

```text
http://localhost:5173
```

For deployment, also add the production site's exact URL and any required password-recovery callback URL.

### 5. Restart the application

Vite reads environment variables when the development server starts. Stop and restart it after changing `.env.local`:

```bash
npm run dev
```

### 6. Register and sign in

Open the application and use the registration page to create an account. If email confirmation is enabled, verify the email before signing in.

> Supabase Auth manages the user identity and session. It does not automatically create cloud backups or synchronize the shop's local business records. Do not describe local data as cloud-synced unless a separate, tested synchronization layer has been added.

---

## Using the Demo Shop

If the current build includes the demo shop loader:

1. Open Dukaan Saathi.
2. Enter the demo shop.
3. Confirm the sample products and customer are present.
4. Open the voice/text transaction entry.
5. Enter:

   ```text
   2 kilo chawal aur 1 tel, Ramesh ko udhaar
   ```

6. Review the parsed products, quantities, customer, and payment mode.
7. Confirm that the bill total is ₹320.
8. Save the bill.
9. Check that Ramesh's balance is ₹1,140 and oil stock is 2 litres, assuming the demo starting values shown above.

Demo data is sample information. Do not use it as real customer or business information.

---

## Offline and Data Storage

The transaction parser is designed to work locally and does not require an LLM service for the core demo sentence. Voice input depends on browser support and may require microphone permission or an internet connection depending on the browser's speech-recognition implementation. Text entry is the fallback.

Business data is stored locally in the browser in the current local-first MVP. Browser storage is specific to the browser profile and device. Clearing site data, using a different browser, or changing devices can make locally stored records unavailable.

**Important:** Supabase authentication and local business-data persistence are separate. Cloud synchronization, multi-device data access, and cloud backup require a separately implemented and verified sync service.

---

## Testing and Build

Run the scripts available in the root `package.json`.

Common commands:

```bash
# Start the development server
npm run dev

# Run tests, if configured
npm test

# Create a production build
npm run build
```

Before a demo, verify these flows manually:

- Registration and login with configured Supabase credentials.
- Logout and session restoration after refresh.
- Text transaction parsing.
- Voice input in a supported browser.
- Bill confirmation and saving.
- Inventory deduction after a sale.
- Udhaar update after a credit bill.
- Customer payment collection.
- WhatsApp invoice sharing.
- Print / Save PDF.
- Local data persistence after a page refresh.

Only report a test as passing after running it successfully.

---

## Security Notes

- Never commit `.env.local` or any credential file.
- Never put a Supabase `service_role` key or secret key in frontend code.
- Use only the Supabase publishable/public key in the browser.
- Keep private credentials on a trusted server, never in Vite client-side environment variables.
- Do not store real customer information in the public demo dataset.
- If business records are later moved to Supabase, enable and test Row Level Security (RLS) policies for every exposed table.

---

## Current Scope and Limitations

Dukaan Saathi is an MVP intended for demonstration and further development.

- Voice recognition support varies by browser and device. Keep text entry available.
- The local parser supports a defined set of Hindi/Hinglish phrases and product aliases; it may not understand every regional expression.
- Supabase authentication requires project credentials and provider configuration.
- Supabase Auth alone does not synchronize bills, stock, customers, or payments.
- Local browser data is not a substitute for a verified cloud backup.
- No payment gateway or automatic WhatsApp message sending is included. WhatsApp actions open a message for the user to review and send.
- Tax and profit calculations should be checked against the shop's accounting requirements before real-world use.
- The application is not a replacement for professional accounting or tax advice.

---

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the available tests and production build.
5. Open a pull request with a clear description and screenshots for UI changes.

Please avoid committing secrets, real customer data, or local database files.

---

## Project

**Dukaan Saathi**  
HackNova 2026 · Track 4: MSME Growth and Productivity

**Tagline:** *Ab dukaan ka hisaab, sirf bolkar.*
