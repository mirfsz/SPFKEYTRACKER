export const COMPANIES = ['ALPHA 1', 'ALPHA 2', 'ALPHA 3', 'ALPHA 4', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'];

export const KEY_REASONS = [
  { value: 'missing', label: 'Missing' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'no-key', label: 'No key' },
  { value: 'other', label: 'Other' },
];

export const REASON_LABELS = Object.fromEntries(KEY_REASONS.map((reason) => [reason.value, reason.label]));

const CHARLIE_UNUSABLE = [3, 5, 6, 7, 8, 9, 10, 23, 39, 52, 53, 54];
const DELTA_USABLE = [1, 4, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 34, 35, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52];
const DELTA_UNUSABLE = [2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 25, 30, 33, 36, 37, 38, 39, 40, 53, 54];
export const DELTA_CONFLICTS = DELTA_USABLE.filter((number) => DELTA_UNUSABLE.includes(number));

const makeCompany = () => Object.fromEntries(Array.from({ length: 54 }, (_, index) => {
  const number = index + 1;
  return [number, { number, condition: 'usable', location: 'in', reason: null, needsReview: false, updatedAt: null }];
}));

export const buildInitialData = () => {
  const companies = Object.fromEntries(COMPANIES.map((company) => [company, makeCompany()]));
  const legacyMissing = { 'ALPHA 1': [1, 3, 7, 12, 15], 'ALPHA 2': [2, 8, 11], 'ALPHA 3': [4, 9, 14, 22], 'ALPHA 4': [6, 13, 19], BRAVO: [5, 17, 23, 31], ECHO: [29, 37, 42], FOXTROT: [32, 39, 44, 48] };
  Object.entries(legacyMissing).forEach(([company, numbers]) => numbers.forEach(number => {
    companies[company][number] = { ...companies[company][number], condition: 'unusable', reason: 'missing' };
  }));
  CHARLIE_UNUSABLE.forEach((number) => {
    companies.CHARLIE[number] = { ...companies.CHARLIE[number], condition: 'unusable', reason: 'other' };
  });
  DELTA_UNUSABLE.forEach((number) => {
    companies.DELTA[number] = { ...companies.DELTA[number], condition: 'unusable', reason: 'other' };
  });
  DELTA_CONFLICTS.forEach((number) => {
    companies.DELTA[number] = { ...companies.DELTA[number], condition: 'usable', needsReview: true };
  });
  return { version: 2, updatedAt: new Date().toISOString(), companies };
};

const STORAGE_KEY = 'spf-key-tracker-v2';

export const isValidTrackerData = data => data?.version === 2 && typeof data.updatedAt === 'string'
  && Number.isFinite(Date.parse(data.updatedAt)) && COMPANIES.every(company => {
    const records = data.companies?.[company];
    return records && Object.keys(records).length === 54 && Array.from({ length: 54 }, (_, i) => i + 1).every(number => {
      const key = records[number];
      return key?.number === number && ['usable', 'unusable'].includes(key.condition)
        && ['in', 'out'].includes(key.location) && typeof key.needsReview === 'boolean'
        && (key.reason === null || KEY_REASONS.some(reason => reason.value === key.reason));
    });
  });

export const saveTrackerData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (error) { /* storage can be unavailable */ }
};

export const loadTrackerData = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (isValidTrackerData(stored)) return stored;
  } catch (error) { /* use safe defaults */ }
  const initial = buildInitialData();
  try {
    const legacy = JSON.parse(localStorage.getItem('keyData'));
    COMPANIES.forEach(company => {
      const records = legacy?.[company.replace('ALPHA ', 'ALPHA')];
      Object.values(initial.companies[company]).forEach(key => {
        const status = records?.[key.number];
        if (['True', 'False', 'Missing'].includes(status)) {
          initial.companies[company][key.number] = { ...key, condition: status === 'Missing' ? 'unusable' : 'usable',
            location: status === 'False' ? 'out' : 'in', reason: status === 'Missing' ? 'missing' : null, needsReview: false };
        }
      });
    });
  } catch (error) { /* Retain defaults when legacy data is malformed. */ }
  saveTrackerData(initial);
  return initial;
};
