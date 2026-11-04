const { db, COLLECTION } = require('../../lib/core');
const { sendParticipant } = require('../../lib/mail');
const { firestore } = require('firebase-admin');

// One daily Hobby cron at 05:30 UTC = 07:30 in Chisinau in November.
const reminderDates = ['2026-11-21', '2026-11-27', '2026-11-28'];

module.exports = async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Chisinau', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const date = `${values.year}-${values.month}-${values.day}`;
  const index = reminderDates.indexOf(date);
  if (index === -1) return res.status(200).json({ skipped: true, date });

  const key = `reminder${index + 1}`;
  let sent = 0;
  let failed = 0;
  try {
    const snapshot = await db().collection(COLLECTION).get();
    for (const doc of snapshot.docs) {
      const participant = doc.data();
      if ((participant.remindersSent || []).includes(key)) continue;
      try {
        await sendParticipant(participant, true);
        await doc.ref.update({
          remindersSent: firestore.FieldValue.arrayUnion(key)
        });
        sent++;
      } catch (error) {
        failed++;
        console.error('Reminder error', doc.id, error);
      }
    }
    return res.status(200).json({ date, reminder: key, sent, failed });
  } catch (error) {
    console.error('Reminder job error', error);
    return res.status(500).json({ error: 'Reminder job failed' });
  }
};
