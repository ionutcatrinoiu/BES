function normalizeLanguage(value){const language=String(value||'ro').trim().toLowerCase();return ['ro','en','ru'].includes(language)?language:'ro'}
module.exports={normalizeLanguage};
