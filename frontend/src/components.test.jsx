import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CompletedPanel from './CompletedPanel.jsx';
import CourseCatalog from './CourseCatalog.jsx';
import { RankingGroups } from './PrerequisiteRanking.jsx';
import SuggestedOrder from './SuggestedOrder.jsx';

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

describe('CourseCatalog', () => {
  const courses = [
    { code: 'CS 46A', name: 'Introduction to Programming', unit: 4, category: 'Major' },
    { code: 'MATH 30', name: 'Calculus I', unit: 3, category: 'GE' },
    { code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, category: 'Major' },
    { code: 'CS 157B', name: 'Database Management Systems II', unit: 3, category: 'Elective' },
    { code: 'CS 180', name: 'Individual Studies', unit: 0, category: 'Elective' },
    { code: 'CMPE 102', name: 'Assembly Language Programming', unit: 0, category: 'Other' },
  ];
  const base = { courses, completed: [], onToggleCompleted: noop };

  it('renders lower- and upper-division panels with GE, Major, Elective, Other sections in order', () => {
    const html = renderToStaticMarkup(<CourseCatalog {...base} />);
    const lower = html.indexOf('Lower-division classes');
    const upper = html.indexOf('Upper-division classes');
    expect(lower).toBeGreaterThan(-1);
    expect(upper).toBeGreaterThan(lower);
    expect(html).toContain('Lower-division classes <span class="panel-count">(2)</span>');
    expect(html).toContain('Upper-division classes <span class="panel-count">(4)</span>');

    const lowerPart = html.slice(lower, upper);
    expect(lowerPart.indexOf('GE classes')).toBeLessThan(lowerPart.indexOf('Major classes'));
    expect(lowerPart.indexOf('Major classes')).toBeLessThan(lowerPart.indexOf('Elective classes'));
    expect(lowerPart.indexOf('Elective classes')).toBeLessThan(lowerPart.indexOf('Other classes'));
    expect(html.slice(upper).indexOf('Other classes')).toBeLessThan(html.slice(upper).indexOf('CMPE 102'));
    expect(lowerPart).toContain('MATH 30');
    expect(lowerPart).toContain('No lower-division elective classes in the catalog.');
    expect(html.slice(upper)).toContain('No upper-division GE classes in the catalog.');
    expect(html).toContain('<details class="subject-group">');
    expect(html).not.toContain('open=""');
  });

  it('states the units each section needs and the degree total', () => {
    const html = renderToStaticMarkup(<CourseCatalog {...base} />);
    expect(html).toContain('Units to graduate <span class="panel-count">(120)</span>');
    expect(html).toContain('<dt>Major requirements (including 17 elective units)</dt><dd>55</dd>');
    expect(html).toContain('<dt>Total</dt><dd>120</dd>');
    expect(html.match(/class="requirement-note"/g)).toHaveLength(8);
    const upper = html.slice(html.indexOf('Upper-division classes'));
    expect(upper).toContain('<strong>Need 33 units.</strong>');
    expect(upper).toContain('<strong>Need 17 units, including any lower-division electives.</strong>');
    expect(html).toContain('<strong>Not required.</strong>');
  });

  it('shows units, with a note when a course has none published', () => {
    const html = renderToStaticMarkup(<CourseCatalog {...base} />);
    expect(html).toContain('4 units');
    expect(html).toContain('Units not published');
  });

  it('marks completed and covered courses and locks covered checkboxes', () => {
    const html = renderToStaticMarkup(
      <CourseCatalog {...base} completed={['CS 146', 'CS 46A']} implied={[{ code: 'CS 46A', via: 'CS 146' }]} />,
    );
    expect(html).toContain('catalog-row is-completed');
    expect(html).toContain('Covered by CS 146');
    expect(html).toMatch(/id="catalog-completed-CS-46A"[^>]*disabled=""/);
    expect(html).not.toMatch(/id="catalog-completed-CS-146"[^>]*disabled/);
  });
});

describe('SuggestedOrder', () => {
  const courses = [
    { code: 'CS 46A', name: 'Introduction to Programming', unit: 4, category: 'Major', prerequisites: [] },
    { code: 'CS 46AX', name: 'Introduction to Programming', unit: 4, category: 'Major', prerequisites: [], prerequisiteNotes: 'Placement.' },
    { code: 'CS 46B', name: 'Introduction to Data Structures', unit: 4, category: 'Major', prerequisites: ['CS 46A', 'CS 46AX'] },
    { code: 'MATH 42', name: 'Discrete Mathematics', unit: 3, category: 'Major', prerequisites: ['MATH 19'] },
    { code: 'CS 146', name: 'Data Structures and Algorithms', unit: 3, category: 'Major', prerequisites: ['CS 46B', 'MATH 42'] },
    { code: 'PHIL 134', name: 'Computers, Ethics and Society', unit: 3, category: 'Major', prerequisites: [] },
    { code: 'CS 171', name: 'Introduction to Machine Learning', unit: 3, category: 'Elective', prerequisites: [] },
  ];
  const base = { courses, completed: [], onToggleCompleted: noop };

  it('renders one column per step, starting with the classes available now', () => {
    const html = renderToStaticMarkup(<SuggestedOrder {...base} />);
    expect(html).toContain('Suggested order');
    expect(html).toContain('0 of 5 required done');
    expect(html.indexOf('Step 1 · Available now')).toBeLessThan(html.indexOf('Step 2'));
    expect(html.indexOf('Step 2')).toBeLessThan(html.indexOf('Step 3'));
    expect(html).toContain('After CS 46B, MATH 42');
    // Choice groups list each option; single classes show one Completed checkbox.
    expect(html).toContain('CS 46A or CS 46AX');
    expect(html).toContain('id="order-completed-CS-46AX"');
    expect(html).toMatch(/id="order-completed-CS-146"[^>]*\/>Completed</);
    // Electives are not placed.
    expect(html).not.toContain('CS 171');
  });

  it('tags classes without recorded prerequisites and moves unlocked classes forward', () => {
    const html = renderToStaticMarkup(<SuggestedOrder {...base} completed={['CS 46A', 'CS 46B']} />);
    expect(html).toContain('2 of 5 required done');
    expect(html).toContain('Prerequisites not recorded');
    const now = html.slice(html.indexOf('Available now'), html.indexOf('Step 2'));
    expect(now).toContain('MATH 42');
    expect(now).not.toContain('CS 46B');
  });

  it('locks classes covered through prerequisites and shows a finished state', () => {
    const covered = renderToStaticMarkup(
      <SuggestedOrder {...base} courses={[...courses, { code: 'BIOL 30', name: 'Principles of Biology I', unit: 4, category: 'Major', prerequisites: [] }]}
        completed={['BIOL 30']} implied={[{ code: 'BIOL 30', via: 'BIOL 31' }]} />,
    );
    expect(covered).toContain('4 of 8 units');
    expect(covered).toMatch(/id="order-completed-BIOL-30"[^>]*disabled=""/);

    const done = renderToStaticMarkup(<SuggestedOrder {...base} completed={['CS 46A', 'CS 46B', 'MATH 42', 'CS 146', 'PHIL 134']} />);
    expect(done).toContain('You&#x27;ve completed every required major class.');
  });
});
