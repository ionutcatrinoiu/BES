# Configurare independentă BES 2026

Acest pachet folosește exclusiv configurația BES pentru autentificare, sesiune, check-in și Firestore. Nu reutiliza chei sau parole SNOO.

## Vercel, Settings > Environment Variables

- `BES_ADMIN_USERNAME`: numele de utilizator dorit, de exemplu `admin`.
- `BES_ADMIN_PASSWORD_HASH`: hash scrypt în format `salt:hex`.
- `BES_ADMIN_SESSION_SECRET`: secret aleatoriu de minimum 32 caractere.
- `BES_FIREBASE_ADMIN_CONFIG`: JSON complet al contului de serviciu Firebase pentru proiectul separat BES.
- `BES_CHECKIN_PIN`: PIN separat pentru personalul de check-in, dacă activezi această funcție.

Pentru hash, rulează local, în PowerShell, schimbând parola din comandă:

```powershell
node -e "const c=require('crypto');const p='SCHIMBA_PAROLA_AICI';const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync(p,s,64).toString('hex'))"
```

Pentru secretul sesiunii:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Creează în Firebase un proiect nou, de exemplu `bes-2026`, activează Firestore, apoi Project Settings > Service Accounts > Generate private key. Adaugă JSON-ul în Vercel, nu în GitHub. Redeploy după salvarea variabilelor. Accesează `/admin`.

## Structură de deploy

Conținutul acestui ZIP reprezintă rădăcina proiectului Vercel. În GitHub, `api/`, `lib/`, `admin/`, `assets/`, `index.html`, `package.json` și `vercel.json` trebuie să fie la același nivel. Setează Root Directory corespunzător în Vercel.

## E-mailuri

Trimiterea automată a e-mailurilor este dezactivată implicit (`BES_EMAILS_ENABLED` nu este `true`). Există șabloane moștenite din prototip, care necesită revizie editorială înainte de activare. Nu activa `BES_EMAILS_ENABLED=true` până la finalizarea șabloanelor și configurarea Brevo cu `BES_BREVO_SENDER_EMAIL` și `BREVO_API_KEY`. Deschiderea panoului admin nu mai declanșează trimiterea retroactivă a confirmărilor.

## Testare

După deploy, testează autentificarea, accesul neautorizat la `/api/admin/data`, înscrierea de probă și afișarea ei în `/admin`. Nu s-au testat autentificarea și Firestore cu credențiale reale, deoarece nu au fost furnizate.
