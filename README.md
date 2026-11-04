# Brand Experience Summit 2026

Proiect separat, derivat conceptual din formularul SNOO. Nu modifică aplicația originală.

## Configurare Vercel

Variabile obligatorii: `BES_FIREBASE_ADMIN_CONFIG` (JSON service account Firebase pentru un proiect separat), `BES_ADMIN_SESSION_SECRET` (minim 32 caractere), `BES_ADMIN_PASSWORD`, `BES_PUBLIC_URL` (URL public al aplicației), `BES_SENDER_EMAIL`, `BREVO_API_KEY`, `CRON_SECRET`.

Rute: `/` formular, `/admin` administrare, `/checkin` check-in general, `/checkin?token=...` QR personal. QR-ul general trebuie generat din URL-ul public `/checkin`, QR-ul individual din linkul transmis în e-mail. Codurile individuale sunt în format BES + 10 caractere hexazecimale.

## Înainte de lansare

1. Înlocuiește cele 5 texte provizorii ale întrebărilor din `assets/app.js` cu întrebările aprobate de parteneri. În prezent sunt etichete demonstrative, nu întrebări finale.
2. Adaugă logo-urile oficiale autorizate ale celor cinci parteneri. În prezent sunt reprezentate textual.
3. Adaugă un video original/licențiat în `assets/summit-background.mp4`; fundalul animat CSS funcționează și fără video.
4. Verifică programul, acordul privind datele, textele în limbile EN/RU și testează livrarea prin Brevo.
5. Setează proiectul Firebase și credențialele noi. Nu reutiliza proiectul și variabilele SNOO.
6. Testează pe staging și ajustează orele cronului înainte de producție. Reminderele sunt programate pentru 21 noiembrie, 27 noiembrie și 28 noiembrie la 09:30 ora Chișinău pentru primele două, respectiv 07:30 în ziua evenimentului (cu 2 ore înainte).

## Securitate și flux

Check-in-ul public este activ doar pe 28.11.2026 între 08:00 și 23:59 ora Chișinău. Este permis prin QR personal sau prin codul unic primit prin e-mail. Codul QR personal este un link care confirmă automat prezența. Distribuie-l numai participantului. Administratorul poate face check-in manual, inclusiv în afara intervalului. Exportul CSV este disponibil numai în sesiunea de administrare.

Nu au fost incluse fișiere `.env` sau credențiale din arhiva originală.
