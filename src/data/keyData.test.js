import { buildInitialData, DELTA_CONFLICTS, loadTrackerData, saveTrackerData } from './keyData';

describe('key data', () => {
  beforeEach(() => localStorage.clear());

  test('creates 54 independently editable keys for every company', () => {
    const data = buildInitialData();
    Object.values(data.companies).forEach((company) => {
      expect(Object.keys(company)).toHaveLength(54);
      expect(company[1]).toEqual(expect.objectContaining({ number: 1, condition: expect.any(String), location: expect.any(String) }));
    });
  });

  test('seeds the supplied Charlie unusable list', () => {
    const charlie = buildInitialData().companies.CHARLIE;
    expect(Object.values(charlie).filter((key) => key.condition === 'unusable').map((key) => key.number))
      .toEqual([3, 5, 6, 7, 8, 9, 10, 23, 39, 52, 53, 54]);
  });

  test('flags conflicting Delta entries for human review', () => {
    const delta = buildInitialData().companies.DELTA;
    expect(Object.values(delta).filter((key) => key.needsReview).map((key) => key.number)).toEqual(DELTA_CONFLICTS);
    DELTA_CONFLICTS.forEach((number) => expect(delta[number].condition).toBe('usable'));
  });

  test('persists version two records locally', () => {
    const data = buildInitialData();
    data.companies.CHARLIE[1].location = 'out';
    saveTrackerData(data);
    expect(loadTrackerData().companies.CHARLIE[1].location).toBe('out');
  });
});
