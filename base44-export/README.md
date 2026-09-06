# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.

## Run Locally

```bash
base44 dev
```

## Run Only The Frontend

```bash
npm run dev
```

## Use The Hosted Backend

Create or update `.env.local`:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

## Publish Your Changes

```bash
base44 dashboard open
```

Docs: https://docs.base44.com/Integrations/Using-GitHub
