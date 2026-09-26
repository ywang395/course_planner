import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CompletedPanel from './CompletedPanel.jsx';
import { RankingGroups } from './PrerequisiteRanking.jsx';

const noop = () => {};

function row(code, overrides = {}) {
  return { code, name: `${code} name`, unit: 3, inCatalog: true, completed: false, count: 2, remainingCount: 2, requiredBy: ['CS 149', 'CS 157A'], ...overrides };
}

describe('CompletedPanel', () => {
  it('shows the count, removable chips and clear-all when classes are completed', () => {
    const html = renderToStaticMarkup(
      <CompletedPanel completed={['CS 46A', 'MATH 19']} knownCodes={['CS 46A', 'CS 146']} courseNames={{ 'CS 46A': 'Intro' }} onAdd={noop} onRemove={noop} onClear={noop} />,
    );
    expect(html).toContain('(2)');
    expect(html).toContain('aria-label="Remove MATH 19 from completed classes"');
    expect(html).toContain('title="Not in catalog"');
    expect(html).toContain('Clear all');
    expect(html).toContain('<label for="completed-input">');
    // Suggestions exclude already-completed codes.
    expect(html).toContain('value="CS 146"');
    expect(html).not.toContain('value="CS 46A"');
  });

  it('lists classes counted through prerequisites without remove buttons', () => {
    const html = renderToStaticMarkup(
      <CompletedPanel completed={['CS 146']} implied={[{ code: 'CS 46B', via: 'CS 146' }, { code: 'MATH 19', via: 'CS 146' }]}
        knownCodes={['CS 46B', 'CS 47', 'MATH 19']} courseNames={{}} onAdd={noop} onRemove={noop} onClear={noop} />,
    );
    expect(html).toContain('Also counted as completed');
    expect(html).toContain('(2)');
    expect(html).toContain('via CS 146');
    expect(html).not.toContain('Remove CS 46B');
    // Covered classes are not suggested again.
    expect(html).toContain('value="CS 47"');
    expect(html).not.toContain('value="CS 46B"');
  });

  it('shows an empty state, the undo prompt and a storage warning', () => {
    const html = renderToStaticMarkup(
      <CompletedPanel completed={[]} lastCleared={['CS 46A', 'CS 47']} storageAvailable={false} onAdd={noop} onRemove={noop} onClear={noop} onUndoClear={noop} />,
    );
    expect(html).toContain('No completed classes yet.');
    expect(html).toContain('Cleared 2 classes.');
    expect(html).toContain('Undo');
    expect(html).toContain('isn&#x27;t saving your selection');
    expect(html).not.toContain('Clear all');
  });
});

describe('RankingGroups', () => {
  const courses = [
    { code: 'CS 146', description: 'Roadmap: Year 2.' },
    { code: 'MATH 30', description: 'Roadmap: Year 1 Fall; GE Area 2.' },
    { code: 'MATH 42', description: 'Roadmap: Year 1 Spring.' },
  ];
  const base = { courses, hideCompleted: false, onToggleCompleted: noop };

  it('renders code, name, remaining/count, requiredBy and a completed checkbox per row', () => {
    const html = renderToStaticMarkup(
      <RankingGroups {...base} completed={['CS 157A']} rows={[
        row('CS 146', { count: 4, remainingCount: 3 }),
        row('MATH 19', { name: null, unit: null, inCatalog: false }),
      ]} />,
    );
    expect(html).toContain('CS 146');
    expect(html).toContain('3<span class="score-total">/4</span>');
    expect(html).toContain('Listed by 3 courses you have not completed, out of 4 total');
    expect(html).toContain('Not in catalog');
    expect(html).toContain('mini-chip done');
    expect(html).toContain('id="rank-completed-MATH-19"');
  });

  it('separates major and GE classes into subjects that start collapsed', () => {
    const html = renderToStaticMarkup(
      <RankingGroups {...base} completed={[]} rows={[row('MATH 42'), row('CS 146'), row('MATH 30'), row('CMPE 102')]} />,
    );
    const major = html.indexOf('Major classes');
    const ge = html.indexOf('GE classes');
    expect(major).toBeGreaterThan(-1);
    expect(ge).toBeGreaterThan(major);
    // Subjects appear alphabetically inside each section, collapsed by default.
    const majorPart = html.slice(major, ge);
    expect(majorPart.indexOf('>CMPE<')).toBeLessThan(majorPart.indexOf('>CS<'));
    expect(majorPart.indexOf('>CS<')).toBeLessThan(majorPart.indexOf('>MATH<'));
    expect(majorPart).toContain('MATH 42');
    expect(majorPart).not.toContain('MATH 30');
    expect(html.slice(ge)).toContain('MATH 30');
    expect(html).toContain('<details class="subject-group">');
    expect(html).not.toContain('open=""');
    expect(html).toContain('1 class<');
  });

  it('shows how many classes each subject has', () => {
    const html = renderToStaticMarkup(<RankingGroups {...base} completed={[]} rows={[row('CS 146'), row('CS 151')]} />);
    expect(html).toContain('2 classes');
    expect(html).toContain('No GE classes to show.');
  });

  it('marks completed rows from the current selection and can hide them', () => {
    const rows = [row('CS 146'), row('MATH 19')];
    const marked = renderToStaticMarkup(<RankingGroups {...base} rows={rows} completed={['MATH 19']} />);
    expect(marked).toContain('rank-row is-completed');
    expect(marked).toContain('>Completed</span>');

    const hidden = renderToStaticMarkup(<RankingGroups {...base} rows={rows} completed={['MATH 19']} hideCompleted />);
    expect(hidden).toContain('CS 146');
    expect(hidden).not.toContain('MATH 19');
  });

  it('marks classes covered by a completed class and locks their checkbox', () => {
    const html = renderToStaticMarkup(
      <RankingGroups {...base} rows={[row('CS 46B'), row('CS 151')]} completed={['CS 146', 'CS 46B']}
        implied={[{ code: 'CS 46B', via: 'CS 146' }]} />,
    );
    expect(html).toContain('Covered by CS 146');
    expect(html).toContain('Completed (prerequisite of CS 146)');
    expect(html).toMatch(/id="rank-completed-CS-46B"[^>]*disabled=""/);
    expect(html).not.toMatch(/id="rank-completed-CS-151"[^>]*disabled/);
  });

  it('shows elective classes in their own section', () => {
    const html = renderToStaticMarkup(
      <RankingGroups {...base} courses={[...courses, { code: 'CS 48', category: 'Elective' }]} completed={[]} rows={[row('CS 146'), row('CS 48')]} />,
    );
    const elective = html.indexOf('Elective classes');
    expect(elective).toBeGreaterThan(html.indexOf('GE classes'));
    expect(html.slice(elective)).toContain('CS 48');
    expect(html.slice(elective)).not.toContain('CS 146');
  });

  it('shows empty states', () => {
    expect(renderToStaticMarkup(<RankingGroups {...base} rows={[]} completed={[]} />)).toContain('No prerequisite references');
    expect(renderToStaticMarkup(<RankingGroups {...base} rows={[row('CS 146')]} completed={['CS 146']} hideCompleted />))
      .toContain('completed every referenced class');
  });
});
