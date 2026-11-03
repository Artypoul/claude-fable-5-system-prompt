const normalize = (value) => value.normalize("NFKC").toLowerCase();
const tokens = (value) => normalize(value).match(/[\p{L}\p{N}]+/gu) || [];
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function searchSkills(skills, query, limit, offset) {
  const phrase = normalize(query.trim());
  const terms = [...new Set(tokens(phrase))];
  const matches = [];
  for (const skill of skills) {
    const name = normalize(skill.name),
      description = normalize(skill.description);
    let score = 0;
    if (phrase && terms.length) {
      score += name === phrase ? 100 : name.includes(phrase) ? 40 : 0;
      for (const term of terms)
        score +=
          (name.includes(term) ? 10 : 0) + (description.includes(term) ? 2 : 0);
    }
    if (!phrase || score > 0) matches.push({ ...skill, score });
  }
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      compare(normalize(a.name), normalize(b.name)) ||
      compare(a.path, b.path),
  );
  return {
    skills: matches.slice(offset, offset + limit),
    total: matches.length,
    next_offset: offset + limit < matches.length ? offset + limit : null,
  };
}
