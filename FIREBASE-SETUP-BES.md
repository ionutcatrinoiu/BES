# Configurare Firestore pentru BES 2026

1. În Firebase Console creează un proiect nou, de exemplu `bes-2026`, separat de SNOO.
2. În Build > Firestore Database, selectează Create database și modul Production. Alege regiunea europeană potrivită.
3. În Project settings > Service accounts > Firebase Admin SDK, generează o cheie privată JSON. Nu o adăuga în GitHub.
4. În Vercel > proiectul bes > Settings > Environment Variables, adaugă `BES_FIREBASE_ADMIN_CONFIG` cu întregul JSON pe o singură linie, pentru Production, Preview și Development după necesitate.
5. Configurează și autentificarea admin, precum și serviciul de e-mail, conform README-BES.md.
6. Redeploy și testează o înscriere reală. Verifică în Firestore înregistrarea și în panoul /admin.

Baza de date cloud nu poate fi creată prin simpla încărcare a codului. Necesită autorizare în contul Firebase.
