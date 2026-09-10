# Experiment 9: GitHub Actions + Vercel

Import `RDbomb/foodie` in Vercel with the repository root as the project root.
The root vercel.json defines the Vite frontend and Express backend as services
under one origin. Do not select only the frontend folder.

Set these environment variables in Vercel before deployment:

| Name | Value |
| --- | --- |
| MONGO_URI | Your private MongoDB Atlas connection string |
| JWT_SECRET | A fresh random secret of at least 32 characters |
| CLIENT_URL | The exact HTTPS production origin, without a trailing slash |
| GOOGLE_CLIENT_ID | The public Google OAuth web client ID |
| VITE_GOOGLE_CLIENT_ID | The same public client ID |
| VITE_API_URL | /api |

Do not enable SERVE_FRONTEND in Vercel; the frontend service serves built assets.
Add the deployed origin to Google's authorized JavaScript origins.
Keep secrets out of GitHub and screenshots.

Socket.IO uses Vercel's WebSocket beta and MongoDB Atlas change streams to
distribute order updates between function instances. Clients reconnect and
reload their permitted orders when a function expires. A standalone MongoDB
server without replica-set support cannot provide change streams.

Local admin/admin demo staff accounts are deliberately disabled in production.
Provision non-demo staff accounts with strong passwords before testing partner
and administrator workflows on the public deployment.

GitHub Actions runs backend tests and builds the frontend on pushes and pull
requests to main. Vercel's Git integration deploys commits independently unless
deployment checks are configured; a green CI run alone does not prove deployment.

Evidence to capture after deployment verification:
1. GitHub Actions successful run with tests and build steps expanded.
2. Vercel Ready deployment showing the matching Git commit.
3. Public Foodie page with its HTTPS URL.
4. Public /api/health response with success true.
5. A later commit and its successful automatic deployment.

Status: configuration prepared; cloud build, login, and distributed Socket.IO
verification still pending. Experiment 9 is not complete until those pass.
