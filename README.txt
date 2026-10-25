LITTLEPOST — EMAIL DELIVERY EDITION

This project includes:
- index.html: the Littlepost postcard builder
- netlify/functions/send-postcard.mjs: the private server-side email function
- netlify.toml: Netlify configuration

IMPORTANT
A normal Netlify Drop upload of a single HTML file is not enough to run this function. Deploy this project as a repository-connected Netlify site or with Netlify CLI. Keep RESEND_API_KEY in Netlify environment variables; never put it in index.html or commit it to GitHub.

NETLIFY ENVIRONMENT VARIABLES
Required:
  RESEND_API_KEY = your private Resend API key

Optional:
  RESEND_FROM_EMAIL = Littlepost <postcards@your-verified-domain.com>

For initial testing, if RESEND_FROM_EMAIL is not set, the function uses:
  Littlepost <onboarding@resend.dev>
Resend restricts this testing sender to the email address associated with your Resend account. To send postcards to other people, verify a domain in Resend and set RESEND_FROM_EMAIL to an address on that verified domain.

SECURITY NOTE
This is a starter implementation with basic input validation and a honeypot field. Before sharing the site widely, add a CAPTCHA or equivalent anti-abuse protection and rate limiting to reduce the risk of unwanted email sending.
