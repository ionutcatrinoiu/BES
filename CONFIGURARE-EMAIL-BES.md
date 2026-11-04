# E-mailuri BES 2026

Expeditor: no-reply@avvero.ro, prin Brevo.

Variabile Vercel Production: BREVO_API_KEY, BES_BREVO_SENDER_EMAIL, BES_BREVO_SENDER_NAME, CRON_SECRET, BES_FIREBASE_ADMIN_CONFIG.

Activează BES_EMAILS_ENABLED=true numai după testul de trimitere, după verificarea imaginilor publice și după redeploy.

Calendar (Europe/Chisinau):
- Confirmare: imediat după înscriere
- Reminder 1: 21.11.2026 10:00
- Reminder 2: 27.11.2026 10:00
- Reminder 3: 28.11.2026 07:30

Pentru fiecare reminder, starea se salvează în emailStages.r1 / r2 / r3. Starea review necesită verificare în Brevo înainte de retrimitere, pentru a preveni duplicatele.

Important: logo-urile în e-mailuri sunt încărcate din URL-uri publice ale aplicației. Verifică accesibilitatea lor după deployment. Unele aplicații de e-mail nu afișează SVG, de aceea se recomandă conversia logo-ului BES în PNG pentru compatibilitate.

Codurile de 4 cifre sunt limitate la 9000 de combinații. Pentru evenimente publice, codul este vulnerabil la ghicire; recomandă limitare server-side a încercărilor de check-in.
