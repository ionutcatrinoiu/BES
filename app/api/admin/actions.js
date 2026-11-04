// Shared Vercel function for authenticated administrative actions.
const handlers = {
  gift: require('../../lib/admin/handlers/gift'),
  'confirmation-backfill': require('../../lib/admin/handlers/confirmation-backfill'),
  export: require('../../lib/admin/handlers/export'),
  'reminder-test': require('../../lib/admin/handlers/reminder-test')
};
module.exports = async (req, res) => {
  const action = String((req.query || {}).action || '');
  const handler = handlers[action];
  if (!handler) return res.status(404).json({error:'NOT_FOUND'});
  return handler(req, res);
};
