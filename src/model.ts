export const STATUSES = [
  'Backlog',
  'In progress',
  'In review',
  'Done',
] as const;
export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const PROJECT_COLORS = [
  '#7168e7',
  '#dd9252',
  '#4da89b',
  '#d4719f',
  '#578bcf',
] as const;
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Project = {
  id: string;
  name: string;
  color: string;
  description: string;
};
export type Task = {
  id: string;
  number: number;
  title: string;
  description: string;
  projectId: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
};
export type Workspace = {
  version: 1;
  projects: Project[];
  tasks: Task[];
  nextNumber: number;
};
export const STORAGE_KEY = 'concord.workspace.v1';

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function dateOffset(days: number, now = new Date()): string {
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + days,
  );
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function createWorkspace(): Workspace {
  const projects: Project[] = [
    {
      id: 'website',
      name: 'Website refresh',
      color: PROJECT_COLORS[0],
      description: 'A fresh home for a new chapter.',
    },
    {
      id: 'brand',
      name: 'Brand & identity',
      color: PROJECT_COLORS[1],
      description: 'Make every first impression count.',
    },
    {
      id: 'product',
      name: 'Product experience',
      color: PROJECT_COLORS[2],
      description: 'Thoughtful details, better everyday experiences.',
    },
  ];
  const seeds: Omit<Task, 'id' | 'number'>[] = [
    {
      title: 'Explore a new direction for the homepage',
      description:
        'Gather a few references and sketch an initial direction. Keep the story simple, warm, and focused on the people we help.',
      projectId: 'website',
      status: 'Backlog',
      priority: 'High',
      assignee: 'Alex Morgan',
      dueDate: dateOffset(2),
    },
    {
      title: 'Audit the current content',
      description:
        'Review the existing pages and note what to keep, update, and archive.',
      projectId: 'website',
      status: 'Backlog',
      priority: 'Medium',
      assignee: 'Jamie Chen',
      dueDate: dateOffset(4),
    },
    {
      title: 'Build out the color system',
      description:
        'Define primary, secondary, and semantic palettes. Check accessibility in light and dark contexts.',
      projectId: 'brand',
      status: 'Backlog',
      priority: 'Low',
      assignee: '',
      dueDate: '',
    },
    {
      title: 'Design the project overview',
      description:
        'Bring tasks, progress, and the next steps into one useful view.',
      projectId: 'product',
      status: 'In progress',
      priority: 'High',
      assignee: 'Alex Morgan',
      dueDate: dateOffset(1),
    },
    {
      title: 'Refine our wordmark',
      description:
        'Explore spacing and small-size legibility. Prepare two directions for feedback.',
      projectId: 'brand',
      status: 'In progress',
      priority: 'Medium',
      assignee: 'Sam Rivera',
      dueDate: dateOffset(3),
    },
    {
      title: 'Write the about page',
      description:
        'Tell our story in our own voice. Start with why we do this work.',
      projectId: 'website',
      status: 'In progress',
      priority: 'Medium',
      assignee: 'Jamie Chen',
      dueDate: dateOffset(5),
    },
    {
      title: 'Review the onboarding flow',
      description:
        'Walk through the first-use experience and collect feedback on each step.',
      projectId: 'product',
      status: 'In review',
      priority: 'High',
      assignee: 'Sam Rivera',
      dueDate: dateOffset(0),
    },
    {
      title: 'Finalize the type pairing',
      description:
        'Check the final pairing across headings, body text, and UI labels.',
      projectId: 'brand',
      status: 'In review',
      priority: 'Low',
      assignee: 'Alex Morgan',
      dueDate: dateOffset(2),
    },
    {
      title: 'Map the website structure',
      description: 'Create a sitemap for the refreshed website.',
      projectId: 'website',
      status: 'Done',
      priority: 'Medium',
      assignee: 'Jamie Chen',
      dueDate: dateOffset(-1),
    },
    {
      title: 'Collect customer insights',
      description:
        'Pull together the recurring themes from our recent conversations.',
      projectId: 'product',
      status: 'Done',
      priority: 'High',
      assignee: 'Sam Rivera',
      dueDate: dateOffset(-2),
    },
  ];
  return {
    version: 1,
    projects,
    tasks: seeds.map((task, index) => ({
      ...task,
      id: `seed-${index}`,
      number: index + 1,
    })),
    nextNumber: seeds.length + 1,
  };
}

export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const data = value as Workspace;
  if (
    data.version !== 1 ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.tasks) ||
    !Number.isSafeInteger(data.nextNumber) ||
    data.nextNumber < 1
  )
    return false;
  if (
    !data.projects.every(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        !!p.name.trim() &&
        typeof p.description === 'string' &&
        /^#[0-9a-f]{6}$/i.test(p.color),
    )
  )
    return false;
  const projectIds = new Set(data.projects.map((p) => p.id));
  if (projectIds.size !== data.projects.length) return false;
  if (
    !data.tasks.every(
      (t) =>
        t &&
        typeof t.id === 'string' &&
        Number.isSafeInteger(t.number) &&
        t.number > 0 &&
        t.number < data.nextNumber &&
        typeof t.title === 'string' &&
        !!t.title.trim() &&
        typeof t.description === 'string' &&
        projectIds.has(t.projectId) &&
        STATUSES.includes(t.status) &&
        PRIORITIES.includes(t.priority) &&
        typeof t.assignee === 'string' &&
        typeof t.dueDate === 'string' &&
        (t.dueDate === '' || validDate(t.dueDate)),
    )
  )
    return false;
  return (
    new Set(data.tasks.map((t) => t.id)).size === data.tasks.length &&
    new Set(data.tasks.map((t) => t.number)).size === data.tasks.length
  );
}

export function filterTasks(
  tasks: Task[],
  query: string,
  projectId: string,
  priority: string,
): Task[] {
  const needle = query.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (!projectId || task.projectId === projectId) &&
      (!priority || task.priority === priority) &&
      (!needle ||
        `${task.title} ${task.description} ${task.assignee} CON-${task.number} CON-${String(task.number).padStart(2, '0')}`
          .toLowerCase()
          .includes(needle)),
  );
}

export function moveTask(
  workspace: Workspace,
  taskId: string,
  status: Status,
): Workspace {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task,
    ),
  };
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
