# BES 2026, programare remindere

Eveniment: 28 noiembrie 2026, ora 09:30, Capitoles Park, Chișinău.

- Reminder 1: 21.11.2026, 09:30, Europe/Chisinau, cron UTC 07:30.
- Reminder 2: 27.11.2026, 09:30, Europe/Chisinau, cron UTC 07:30.
- Reminder 3: 28.11.2026, 07:30, Europe/Chisinau, cron UTC 05:30.

Pentru activare, setați BES_EMAILS_ENABLED=true în Vercel Production și redeploy. CRON_SECRET și BREVO_API_KEY trebuie să existe deja.

ATENȚIE: Vercel Hobby poate limita frecvența cronurilor și nu garantează execuția la minut. Verificați planul și logurile.

Trimiterile folosesc emailStages.r1/r2/r3 pentru a evita retransmiterea către același participant. Dacă o trimitere eșuează, starea review necesită verificare manuală.
