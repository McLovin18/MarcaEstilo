Stripe Apple Pay domain verification
===================================

Place the exact file Stripe gives you here so it is served at:

  https://<YOUR_DOMAIN>/.well-known/apple-developer-merchantid-domain-association

Steps to add the file locally and deploy:

1. Create the directory (if not present):

   mkdir -p public/.well-known

2. Save the file Stripe provided exactly with this name (no extension):

   public/.well-known/apple-developer-merchantid-domain-association

   - The file content must match Stripe's file exactly.
   - Do NOT wrap it in quotes or HTML; paste raw bytes.

3. Commit and push to your repo and redeploy on Vercel:

   git add public/.well-known/apple-developer-merchantid-domain-association
   git commit -m "chore: add stripe apple pay domain verification file"
   git push origin main

4. Verify the file is publicly accessible (replace YOUR_DOMAIN):

   curl -I https://YOUR_DOMAIN/.well-known/apple-developer-merchantid-domain-association

   Expected response: HTTP/2 200 or 200 OK

5. In Stripe Dashboard -> Apple Pay (or Payment methods) click "Verify" for your domain.

If you'd like, paste the exact contents of the file here and I will add it to the repo and push a commit for you.

Security note: the verification file is public and non-sensitive; keep the content exactly as Stripe provided.
