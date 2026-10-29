# Atlas

Atlas is an open-source project management tool for a small team. It is a calm workspace for projects, tickets, people, and notes. AI is optional: the product works with no API key, and a key only adds summaries, reports, and suggested tickets.

A new install starts empty. There are no sample projects, people, or tickets. The first person to open the app sets up the workspace.

Atlas is released under the [MIT licence](LICENSE).

## What you can do

- **Today** shows the work that needs attention, project progress, and recent notes.
- **Work** is the ticket list and a simple board. Filter by project, status, and search. Edit status, priority, due date, and notes in place.
- **People** is the team, with a workload signal rather than a performance score.
- **Knowledge** holds briefs, decisions, and notes in Markdown.
- **Settings** covers the workspace name, GitHub link, theme, AI provider, members, and login.
- **Assistant** can turn a sentence into a suggested ticket. Nothing is saved until you approve it.

## Requirements

- Node.js 20 or newer
- npm
- A computer or server with a disk that keeps files between restarts

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The first screen is setup. Atlas does not create a workspace until you finish it.

1. Name the workspace, and add your name and email.
2. Optionally name the first project. You can skip this and create projects later.
3. Choose login.
   - **Just this server** has no shared sign-in. Anyone who can open the URL can use the workspace. Use this for a private machine.
   - **Firebase Authentication** gives each person an email and password. Only emails listed in Members can enter.
4. Optionally paste an AI key. Leave it blank to skip AI.

After setup, create a project from **Work**, then add tickets. Add teammates from **Settings → Members**.

To run setup again, stop the app and delete `data/store.json`.

## Connect Firebase login

Use this when the app is hosted and more than one person should sign in.

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Open **Build → Authentication** and enable the **Email/Password** provider.
3. Open **Project settings → General**, add a **Web app**, and copy these four values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`
4. Open **Authentication → Settings → Authorized domains** and add the domain where Atlas is hosted, such as `pm.example.com`. Firebase already allows `localhost`.
5. Paste the four values into the Atlas setup screen, or later into **Settings → Login**, then choose **Use Firebase**.
6. Create the owner login with an email and a password of at least 6 characters.
7. Add each teammate in **Settings → Members** using the same email they will use to sign in.

Atlas stores the Firebase web config with the workspace. It does not store passwords. A signed-in email can open the workspace only when it matches a member.

## Add AI

AI is off until you add a key during setup or in **Settings → AI**.

Supported providers:

- OpenAI
- Anthropic
- Any OpenAI-compatible endpoint, such as OpenRouter or Groq

You can also put a server fallback key in `.env.local`. Copy `.env.example` first.

```bash
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
```

The key is used only on the server. Suggested changes stay as proposals until someone approves them.

## Host it

```bash
npm install
npm run build
npm run start
```

The production server listens on port 3000. Put it behind your own HTTPS address.

`data/store.json` is the database. Back it up, and do not commit it. This file storage needs a normal server with a persistent disk. A serverless host will wipe it on restart.

In **Settings → General**, paste your GitHub repository URL. It appears in the sidebar so visitors can find the source.

## Scripts

```bash
npm run dev        # local app at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm test           # unit tests
npm run typecheck  # TypeScript check
```

## Project layout

- `app/` pages and API routes
- `components/` screens and the setup flow
- `lib/` workspace model, insights, and AI
- `data/store.json` created on first run and kept out of git
