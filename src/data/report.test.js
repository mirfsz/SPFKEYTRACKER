import { generateReport, formatNumbers } from './report';
import { buildInitialData, COMPANIES, loadTrackerData, isValidTrackerData } from './keyData';

test('report includes every company regardless of selected board, with classroom levels and reconciled counts', () => {
  const data = buildInitialData();
  data.companies.ECHO[51].location = 'out';
  data.companies.FOXTROT[54].location = 'out';
  const report = generateReport(data, new Date('2026-11-20T18:00:00Z'));
  COMPANIES.forEach(company => expect(report).toContain(`${company.replace('ALPHA ', 'ALPHA')} – 54 keys in total`));
  expect(report).toContain('Date: 21 Nov 2026');
  expect(report).toContain('Day: Saturday');
  expect(report).toContain('• Level 1 classroom');
  expect(report).toContain('• Level 4 classroom');
  expect(report).toContain('Drawn: 54 (1 keys)');
  expect(report).toContain('CHARLIE – 54 keys in total\nCurrently holding: 42 keys');
});

test('range formatting sorts and removes duplicates', () => {
  expect(formatNumbers([7, 3, 2, 1, 3, 9, 8])).toBe('1–3, 7–9');
  expect(formatNumbers([])).toBe('None');
});

test('legacy device records migrate without losing drawn or missing states', () => {
  localStorage.clear();
  localStorage.setItem('keyData', JSON.stringify({ ALPHA1: { 2: 'False', 3: 'Missing' } }));
  const data = loadTrackerData();
  expect(data.companies['ALPHA 1'][2].location).toBe('out');
  expect(data.companies['ALPHA 1'][3].reason).toBe('missing');
  expect(isValidTrackerData(data)).toBe(true);
  expect(isValidTrackerData({ version: 2, companies: {} })).toBe(false);
});
