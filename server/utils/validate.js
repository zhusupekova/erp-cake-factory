function requireFields(obj, fields) {
  const missing = [];
  for (const f of fields) if (!(f in obj)) missing.push(f);
  return missing;
}

module.exports = { requireFields };
