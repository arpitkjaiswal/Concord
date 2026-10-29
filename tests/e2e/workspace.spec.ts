import { expect, test } from '@playwright/test';

test('create a project and task, edit its status, and keep changes after reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Good work starts here.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add project', exact: true }).click();
  await page.getByLabel('Project name', { exact: true }).fill('Launch');
  await page
    .getByLabel('Description', { exact: true })
    .fill('Bring Concord to life.');
  await page
    .getByRole('button', { name: 'Create project', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Launch', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task name', { exact: true }).fill('Ship Concord');
  await page
    .getByLabel('Description', { exact: true })
    .fill('Check the entire workflow.');
  await page
    .getByRole('combobox', { name: 'Priority', exact: true })
    .selectOption('High');
  await page.getByLabel('Assignee', { exact: true }).fill('Alex Morgan');
  await page.getByLabel('Due date', { exact: true }).fill('2026-11-15');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Backlog column' })
      .getByRole('button', { name: 'Open task: Ship Concord' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open task: Ship Concord' }).click();
  await page
    .getByRole('combobox', { name: 'Status', exact: true })
    .selectOption('Done');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page
      .getByRole('region', { name: 'Done column' })
      .getByRole('button', { name: 'Open task: Ship Concord' }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('navigation', { name: 'Projects', exact: true })
    .getByRole('button', { name: 'Launch' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open task: Ship Concord' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Ship Concord');
  await page
    .getByRole('combobox', { name: 'Status of Ship Concord' })
    .selectOption('In review');
  await page.getByRole('button', { name: 'Board', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'In review column' })
      .getByRole('button', { name: 'Open task: Ship Concord' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('search, project, and priority filters find the right tasks and show empty states', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Projects', exact: true })
    .getByRole('button', { name: 'Website refresh' })
    .click();
  await page
    .getByRole('combobox', { name: 'Filter by priority' })
    .selectOption('High');
  await expect(page.getByRole('button', { name: /^Open task:/ })).toHaveCount(
    1,
  );
  await page
    .getByRole('textbox', { name: 'Search tasks' })
    .fill('no matching title');
  await expect(page.getByRole('button', { name: /^Open task:/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByText('No matching tasks', { exact: true }),
  ).toHaveCount(4);
  await page
    .getByRole('button', { name: 'Clear filters', exact: true })
    .click();
  await expect(page.getByRole('button', { name: /^Open task:/ })).toHaveCount(
    4,
  );
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('CON-1');
  await expect(page.getByRole('button', { name: /^Open task:/ })).toHaveCount(
    1,
  );
});

test('drag and drop moves a task and deleting requires confirmation', async ({
  page,
}) => {
  await page.goto('/');
  const title = 'Audit the current content';
  const task = page.getByRole('button', {
    name: `Open task: ${title}`,
    exact: true,
  });
  await task.dragTo(page.getByRole('region', { name: 'Done column' }));
  await expect(
    page
      .getByRole('region', { name: 'Done column' })
      .getByRole('button', { name: `Open task: ${title}` }),
  ).toBeVisible();
  await task.click();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(
    page.getByText('Delete this task? This cannot be undone.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep task' }).click();
  await expect(
    page.getByText('Delete this task? This cannot be undone.'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, delete task' }).click();
  await expect(task).toHaveCount(0);
  await page.reload();
  await expect(task).toHaveCount(0);
});

test('malformed saved data is preserved and explained instead of silently overwritten', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('concord.workspace.v1', '{broken-json'),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'existing browser data will stay untouched',
  );
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task name', { exact: true }).fill('Session-only task');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open task: Session-only task' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('concord.workspace.v1')),
  ).toBe('{broken-json');
});

test('mobile layout supports project creation and task editing without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project name', { exact: true }).fill('Mobile project');
  await page
    .getByRole('button', { name: 'Create project', exact: true })
    .click();
  await expect(
    page.getByRole('combobox', { name: 'Select project' }),
  ).toHaveValue(/.+/);
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task name', { exact: true }).fill('Made on mobile');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open task: Made on mobile' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('combobox', { name: 'Select project' })
    .selectOption('website');
  await expect(
    page.getByRole('heading', { name: 'Website refresh', exact: true }),
  ).toBeVisible();
});

test('keyboard search shortcut and Escape work with the task dialog', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(
    page.getByRole('textbox', { name: 'Search tasks' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await expect(page.getByLabel('Task name', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('unavailable browser storage warns that edits will not survive a reload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage full', 'QuotaExceededError');
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task name', { exact: true }).fill('Unsaved task');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open task: Unsaved task' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Changes are kept for this session only.',
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Open task: Unsaved task' }),
  ).toHaveCount(0);
});
