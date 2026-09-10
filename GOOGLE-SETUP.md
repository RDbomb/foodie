# Customer Google sign-in setup

The application code is ready. A real OAuth Web client ID must be configured before Google sign-in works. No client secret is needed for this Google Identity Services flow.

1. Sign in at https://console.cloud.google.com/auth/overview.
2. Create or select a project named **Foodie Lab**.
3. In Google Auth Platform, complete Branding: app name **Foodie**, your support email, and your developer contact email. Choose **External** audience for personal Gmail accounts. Review any Google terms yourself.
4. Keep access limited to basic identity: `openid`, `email`, and `profile`. Foodie does not need Gmail, Drive, contacts, or billing access.
5. Open **Clients → Create client → Web application**. Name it **Foodie Local Web**.
6. Add these **Authorized JavaScript origins**:

   ```text
   http://localhost
   http://localhost:5173
   ```

7. Leave redirect URIs empty: this implementation receives the Google credential through a JavaScript popup callback.
8. Create the client and copy its public Client ID ending in `.apps.googleusercontent.com`.
9. Put the same ID in both places:

   `backend/.env`:
   ```dotenv
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   ```

   Create `frontend/.env.local`:
   ```dotenv
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   ```

10. Restart both development servers. Open http://localhost:5173/login/customer, choose Continue with Google, and select your account. Your Foodie customer account is created only after the backend verifies Google's signed credential.

If Google restricts the application to test users, add the Google account you are testing with on the Audience page. An origin error means the exact frontend origin has not been added to the Web client. Use `localhost:5173`, not `127.0.0.1` or a different port.

The backend stores customers and roles in MongoDB and issues its own two-hour JWT session in an HttpOnly cookie. Never put JWT_SECRET, passwords, or MongoDB credentials in VITE variables.

Official setup: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
Official server verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
