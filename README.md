# EMC AI Consultation App

This repository contains a Vite + React single-page app with a Vercel serverless function for Anthropic API calls.

## Local development

Use Node.js `20.19+`.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env vars:
   ```bash
   cp .env.example .env.local
   ```
3. Set `ANTHROPIC_API_KEY` in `.env.local`.
4. Start dev server:
   ```bash
   npm run dev
   ```

## Vercel deployment

1. Import this repository in Vercel.
2. Keep defaults from `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework preset: `Vite`
3. Add environment variable in Vercel project settings:
   - `ANTHROPIC_API_KEY`
4. Deploy.

The frontend calls `/api/claude`, and the Vercel function in `api/claude.js` securely forwards requests to Anthropic using `ANTHROPIC_API_KEY`.
