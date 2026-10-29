import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createWorkspace,
  dateOffset,
  filterTasks,
  initials,
  isWorkspace,
  moveTask,
} from '../src/model.ts';

test('sample workspace is valid and every task belongs to a project', () => {
  const workspace = createWorkspace();
  assert.equal(isWorkspace(workspace), true);
  assert.equal(workspace.tasks.length, 10);
  assert.equal(workspace.projects.length, 3);
});

test('search finds titles, descriptions, assignees, and task references without case sensitivity', () => {
  const { tasks } = createWorkspace();
  assert.equal(filterTasks(tasks, '  WORDMARK ', '', '')[0].number, 5);
  assert.equal(filterTasks(tasks, 'semantic palettes', '', '')[0].number, 3);
  assert.ok(
    filterTasks(tasks, 'JAMIE', '', '').every(
      (task) => task.assignee === 'Jamie Chen',
    ),
  );
  assert.equal(filterTasks(tasks, 'con-7', '', '')[0].number, 7);
  assert.equal(filterTasks(tasks, 'con-07', '', '')[0].number, 7);
  assert.equal(filterTasks(tasks, 'not-a-real-task', '', '').length, 0);
});

test('project and priority filters combine with search', () => {
  const { tasks } = createWorkspace();
  assert.deepEqual(
    filterTasks(tasks, 'homepage', 'website', 'High').map(
      (task) => task.number,
    ),
    [1],
  );
  assert.equal(filterTasks(tasks, 'homepage', 'brand', 'High').length, 0);
  assert.equal(filterTasks(tasks, 'homepage', 'website', 'Low').length, 0);
});

test('moving a task updates only that task and preserves the original workspace', () => {
  const original = createWorkspace();
  const changed = moveTask(original, original.tasks[0].id, 'Done');
  assert.equal(changed.tasks[0].status, 'Done');
  assert.equal(original.tasks[0].status, 'Backlog');
  assert.deepEqual(changed.tasks.slice(1), original.tasks.slice(1));
  assert.equal(isWorkspace(changed), true);
});

test('stored data validation rejects broken references, duplicates, invalid counters, and malformed tasks', () => {
  assert.equal(isWorkspace(null), false);
  assert.equal(isWorkspace({ version: 2 }), false);
  for (const mutate of [
    (w: ReturnType<typeof createWorkspace>) => {
      w.tasks[0].projectId = 'missing';
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.tasks[0].title = '  ';
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.tasks[0].dueDate = 'not-a-date';
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.tasks[0].dueDate = '2026-02-30';
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.tasks[1].number = w.tasks[0].number;
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.tasks[1].id = w.tasks[0].id;
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.projects[0].color = 'javascript:invalid';
    },
    (w: ReturnType<typeof createWorkspace>) => {
      w.nextNumber = 1;
    },
  ]) {
    const workspace = createWorkspace();
    mutate(workspace);
    assert.equal(isWorkspace(workspace), false);
  }
});

test('date offsets use local dates and cross month and year boundaries', () => {
  assert.equal(dateOffset(1, new Date(2025, 11, 31, 23)), '2026-01-01');
  assert.equal(dateOffset(-1, new Date(2024, 2, 1)), '2024-02-29');
});

test('initials handle whitespace and limit the avatar to two letters', () => {
  assert.equal(initials('  Alex   Morgan  '), 'AM');
  assert.equal(initials('Sam'), 'S');
  assert.equal(initials(''), '');
});
