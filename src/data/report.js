import { COMPANIES, KEY_REASONS } from './keyData';

export function formatNumbers(numbers) {
  const values = [...new Set(numbers)].sort((a, b) => a - b);
  if (!values.length) return 'None';
  const ranges = [];
  let start = values[0];
  let end = start;
  for (let index = 1; index <= values.length; index += 1) {
    if (values[index] === end + 1) end = values[index];
    else {
      ranges.push(start === end ? `${start}` : `${start}–${end}`);
      start = values[index];
      end = start;
    }
  }
  return ranges.join(', ');
}

export function generateReport(data, now = new Date()) {
  const options = { timeZone: 'Asia/Singapore' };
  const lines = ['Key Status Report', `Date: ${now.toLocaleDateString('en-GB', { ...options, day: '2-digit', month: 'short', year: 'numeric' })}`,
    `Day: ${now.toLocaleDateString('en-GB', { ...options, weekday: 'long' })}`, ''];
  COMPANIES.forEach(company => {
    const keys = Object.values(data.companies[company]).sort((a, b) => a.number - b.number);
    const usable = keys.filter(key => key.condition === 'usable');
    const drawn = usable.filter(key => key.location === 'out');
    const unusable = keys.filter(key => key.condition === 'unusable');
    const review = keys.filter(key => key.needsReview);
    lines.push(`${company.replace('ALPHA ', 'ALPHA')} – ${keys.length} keys in total`,
      `Currently holding: ${usable.length - drawn.length} keys`,
      `Drawn: ${formatNumbers(drawn.map(key => key.number))} (${drawn.length} keys)`,
      `Unusable: ${formatNumbers(unusable.map(key => key.number))} (${unusable.length} keys)`);
    KEY_REASONS.forEach(reason => {
      const matching = unusable.filter(key => key.reason === reason.value);
      if (matching.length) lines.push(`${reason.label}: ${formatNumbers(matching.map(key => key.number))} (${matching.length} keys)`);
    });
    const classrooms = drawn.filter(key => key.number >= 51 && key.number <= 54);
    if (classrooms.length) lines.push('Classroom keys drawn:', ...classrooms.map(key => `• Level ${key.number - 50} classroom`));
    if (review.length) lines.push(`Needs review: ${formatNumbers(review.map(key => key.number))} (${review.length} keys)`);
    lines.push('');
  });
  return lines.join('\n').trim();
}
