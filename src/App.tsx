import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDashed,
  Columns3,
  Flag,
  FolderKanban,
  LayoutGrid,
  List,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  createWorkspace,
  dateOffset,
  filterTasks,
  initials,
  isWorkspace,
  moveTask,
  PRIORITIES,
  PROJECT_COLORS,
  STATUSES,
  STORAGE_KEY,
} from './model';
import type { Priority, Project, Status, Task, Workspace } from './model';

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved)
      return { workspace: createWorkspace(), error: '', persist: true };
    const parsed: unknown = JSON.parse(saved);
    if (!isWorkspace(parsed)) throw new Error('Invalid workspace');
    return { workspace: parsed, error: '', persist: true };
  } catch {
    return {
      workspace: createWorkspace(),
      error:
        'Saved data could not be loaded. You can explore sample data for this session; existing browser data will stay untouched.',
      persist: false,
    };
  }
}

function StatusIcon({ status, size = 15 }: { status: Status; size?: number }) {
  if (status === 'Done') return <CircleCheck size={size} />;
  if (status === 'In progress')
    return <Circle size={size} className="progress-icon" />;
  if (status === 'In review') return <CircleDashed size={size} />;
  return <Circle size={size} />;
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className={`avatar avatar-${name.charCodeAt(0) % 4}`}
      title={name}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      <Flag size={10} fill="currentColor" />
      {priority}
    </span>
  );
}

function dueLabel(date: string) {
  if (date === dateOffset(0)) return 'Today';
  if (date === dateOffset(1)) return 'Tomorrow';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    element.querySelector<HTMLElement>('input, textarea, select')?.focus();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-content">
        <div className="modal-heading">
          <div>
            <h2 id="dialog-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function TaskEditor({
  task,
  projects,
  defaultProject,
  defaultStatus,
  onSave,
  onDelete,
  onClose,
}: {
  task: Task | null;
  projects: Project[];
  defaultProject: string;
  defaultStatus: Status;
  onSave: (task: Omit<Task, 'id' | 'number'>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [projectId, setProjectId] = useState(
    task?.projectId ?? (defaultProject || projects[0]?.id || ''),
  );
  const [status, setStatus] = useState<Status>(task?.status ?? defaultStatus);
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? 'Medium',
  );
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !projectId) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      projectId,
      status,
      priority,
      assignee: assignee.trim(),
      dueDate,
    });
  }
  return (
    <Modal
      title={
        task ? `CON-${task.number} · Task details` : 'Make something happen'
      }
      subtitle={
        task
          ? 'Good work starts with a little clarity.'
          : 'A small next step for your next big thing.'
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="editor-form">
        <label>
          Task name
          <input
            autoFocus
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to get done?"
          />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a little context, a few details, or a plan…"
          />
        </label>
        <div className="form-grid">
          <label>
            Project
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              min="0001-01-01"
              max="9999-12-31"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
        <label>
          Assignee
          <input
            value={assignee}
            maxLength={80}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Unassigned"
            list="assignees"
          />
        </label>
        <datalist id="assignees">
          <option>Alex Morgan</option>
          <option>Jamie Chen</option>
          <option>Sam Rivera</option>
        </datalist>
        {confirmDelete && (
          <div className="delete-confirm">
            <p>Delete this task? This cannot be undone.</p>
            <button type="button" className="danger-button" onClick={onDelete}>
              Yes, delete task
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirmDelete(false)}
            >
              Keep task
            </button>
          </div>
        )}
        <div className="modal-footer">
          {task && (
            <button
              type="button"
              className="icon-button delete-button"
              aria-label="Delete task"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} />
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            type="submit"
            disabled={!title.trim() || !projectId}
          >
            {task ? 'Save changes' : 'Create task'}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectEditor({
  projects,
  onSave,
  onClose,
}: {
  projects: Project[];
  onSave: (project: Project) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(
    PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
  );
  const duplicate = projects.some(
    (project) => project.name.toLowerCase() === name.trim().toLowerCase(),
  );
  return (
    <Modal
      title="A new place for your ideas"
      subtitle="Bring the right tasks together in a project."
      onClose={onClose}
    >
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && !duplicate)
            onSave({
              id: crypto.randomUUID(),
              name: name.trim(),
              description: description.trim(),
              color,
            });
        }}
      >
        <label>
          Project name
          <input
            autoFocus
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The next big launch"
            aria-describedby={duplicate ? 'duplicate-error' : undefined}
          />
        </label>
        {duplicate && (
          <p id="duplicate-error" className="field-error">
            There’s already a project with this name.
          </p>
        )}
        <label>
          Description
          <textarea
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What’s this project all about?"
          />
        </label>
        <fieldset className="color-picker">
          <legend>Project color</legend>
          {PROJECT_COLORS.map((value) => (
            <label key={value} style={{ '--swatch': value } as CSSProperties}>
              <input
                type="radio"
                name="color"
                value={value}
                checked={color === value}
                onChange={() => setColor(value)}
                aria-label={`Color ${value}`}
              />
              <span>{color === value && <Check size={16} />}</span>
            </label>
          ))}
        </fieldset>
        <div className="modal-footer">
          <span className="spacer" />
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={!name.trim() || duplicate}
          >
            Create project
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskCard({
  task,
  project,
  onOpen,
}: {
  task: Task;
  project: Project;
  onOpen: () => void;
}) {
  return (
    <button
      className={`task-card ${task.status === 'Done' ? 'completed-card' : ''}`}
      onClick={onOpen}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      aria-label={`Open task: ${task.title}`}
    >
      <div className="card-top">
        <span
          className="project-tag"
          style={{ '--project-color': project.color } as CSSProperties}
        >
          <span />
          {project.name}
        </span>
        <MoreHorizontal size={16} className="card-menu" aria-hidden="true" />
      </div>
      <h3>{task.title}</h3>
      {task.description && (
        <p className="card-description">{task.description}</p>
      )}
      <PriorityBadge priority={task.priority} />
      <div className="card-footer">
        <span className="task-number">
          CON-{String(task.number).padStart(2, '0')}
        </span>
        {task.dueDate && (
          <span
            className={`due-date ${task.dueDate < dateOffset(0) && task.status !== 'Done' ? 'overdue' : ''}`}
          >
            <CalendarDays size={12} />
            {dueLabel(task.dueDate)}
          </span>
        )}
        {task.assignee ? (
          <Avatar name={task.assignee} />
        ) : (
          <span className="unassigned" title="Unassigned">
            –
          </span>
        )}
      </div>
    </button>
  );
}

export default function App() {
  const [initial] = useState(loadWorkspace);
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace);
  const [storageError, setStorageError] = useState(initial.error);
  const [projectId, setProjectId] = useState('');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [completedOnly, setCompletedOnly] = useState(false);
  const [editor, setEditor] = useState<{
    task: Task | null;
    status: Status;
  } | null>(null);
  const [projectEditor, setProjectEditor] = useState(false);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    if (!announcement) return;
    const timer = window.setTimeout(() => setAnnouncement(''), 3500);
    return () => window.clearTimeout(timer);
  }, [announcement]);

  function commit(next: Workspace, message: string) {
    setWorkspace(next);
    if (initial.persist) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setStorageError('');
      } catch {
        setStorageError(
          'Browser storage is unavailable or full. Changes are kept for this session only.',
        );
      }
    }
    setAnnouncement(message);
  }

  const selectedProject = workspace.projects.find(
    (project) => project.id === projectId,
  );
  const projectTasks = workspace.tasks.filter(
    (task) => !projectId || task.projectId === projectId,
  );
  const done = projectTasks.filter((task) => task.status === 'Done').length;
  const inProgress = projectTasks.filter(
    (task) => task.status === 'In progress',
  ).length;
  const completion = projectTasks.length
    ? Math.round((done / projectTasks.length) * 100)
    : 0;
  const filtered = filterTasks(projectTasks, query, '', priority).filter(
    (task) => !completedOnly || task.status === 'Done',
  );
  const hasFilters = !!query || !!priority;
  const title = completedOnly
    ? 'A little progress, every day.'
    : (selectedProject?.name ?? 'Good work starts here.');
  function navigate(id: string, completed = false) {
    setProjectId(id);
    setCompletedOnly(completed);
    setQuery('');
    setPriority('');
  }
  function openNew(status: Status = 'Backlog') {
    setEditor({ task: null, status });
  }
  function saveTask(values: Omit<Task, 'id' | 'number'>) {
    if (!editor) return;
    const task = editor.task;
    const next = task
      ? {
          ...workspace,
          tasks: workspace.tasks.map((existing) =>
            existing.id === task.id ? { ...task, ...values } : existing,
          ),
        }
      : {
          ...workspace,
          tasks: [
            ...workspace.tasks,
            {
              ...values,
              id: crypto.randomUUID(),
              number: workspace.nextNumber,
            },
          ],
          nextNumber: workspace.nextNumber + 1,
        };
    commit(next, task ? 'Task updated' : 'Task created');
    setEditor(null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate('');
          }}
          aria-label="Concord home"
        >
          <span className="brand-mark">
            <span />
          </span>
          concord<span className="brand-period">.</span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-icon">S</span>
          <div>
            <strong>Studio workspace</strong>
            <span>Your space to make things</span>
          </div>
          <LockKeyhole size={13} />
        </div>
        <span className="section-label">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          <button
            className={`nav-item ${!projectId && !completedOnly ? 'active' : ''}`}
            onClick={() => navigate('')}
          >
            <LayoutGrid size={17} />
            All tasks<span className="nav-count">{workspace.tasks.length}</span>
          </button>
          <button
            className={`nav-item ${completedOnly ? 'active' : ''}`}
            onClick={() => navigate('', true)}
          >
            <CheckCheck size={18} />
            Completed
            <span className="nav-count">
              {workspace.tasks.filter((task) => task.status === 'Done').length}
            </span>
          </button>
        </nav>
        <div className="project-section-heading">
          <span className="section-label">YOUR PROJECTS</span>
          <button
            className="icon-button"
            aria-label="Add project"
            onClick={() => setProjectEditor(true)}
          >
            <Plus size={15} />
          </button>
        </div>
        <nav aria-label="Projects" className="projects-nav">
          {workspace.projects.map((project) => (
            <button
              key={project.id}
              className={`nav-item project-nav-item ${projectId === project.id ? 'active' : ''}`}
              onClick={() => navigate(project.id)}
            >
              <span
                className="project-square"
                style={{ background: project.color }}
              />
              <span className="project-nav-name">{project.name}</span>
              <span className="nav-count">
                {
                  workspace.tasks.filter(
                    (task) => task.projectId === project.id,
                  ).length
                }
              </span>
            </button>
          ))}
        </nav>
        <button className="add-project" onClick={() => setProjectEditor(true)}>
          <Plus size={15} />
          Create a project
        </button>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">
              <Sparkles size={18} />
            </span>
            <h3>
              A little structure.
              <br />A lot more possibility.
            </h3>
            <p>
              Big ideas start with small steps.
              <br />
              Make room for yours.
            </p>
          </div>
          <div className="local-status">
            <span className="local-dot" />
            <div>
              <strong>Local workspace</strong>
              <span>Saved in this browser</span>
            </div>
            <LockKeyhole size={15} />
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <FolderKanban size={17} />
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>
              {completedOnly
                ? 'Completed'
                : (selectedProject?.name ?? 'All tasks')}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">
              <span />
              Local mode
            </span>
            <div className="profile-avatar" title="Demo workspace">
              S
            </div>
          </div>
        </header>
        <div className="main-content">
          {storageError && (
            <div className="storage-warning" role="alert">
              {storageError}
            </div>
          )}
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span />A LITTLE FOCUS GOES A LONG WAY
              </div>
              <h1>{title}</h1>
              <p>
                {completedOnly
                  ? 'Every finished task is a step forward. Look how far you’ve come.'
                  : (selectedProject?.description ??
                    'Big ideas, small steps. Bring it all together in one place.')}
              </p>
            </div>
            <button
              className="primary-button new-task-button"
              onClick={() => openNew()}
            >
              <Plus size={17} />
              New task
            </button>
          </section>
          <div className="mobile-project-picker">
            <label>
              <FolderKanban size={15} />
              <select
                aria-label="Select project"
                value={projectId}
                onChange={(event) => navigate(event.target.value)}
              >
                <option value="">All projects</option>
                {workspace.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-button"
              onClick={() => setProjectEditor(true)}
            >
              <Plus size={14} />
              New project
            </button>
          </div>
          <section className="stats-grid" aria-label="Project summary">
            <div className="stat-card">
              <div>
                <span>Total tasks</span>
                <strong>
                  {projectTasks.length}
                  <small>on your radar</small>
                </strong>
              </div>
              <span className="stat-icon gray">
                <FolderKanban size={19} />
              </span>
            </div>
            <div className="stat-card">
              <div>
                <span>In progress</span>
                <strong>
                  {inProgress}
                  <small>ideas in motion</small>
                </strong>
              </div>
              <span className="stat-icon purple">
                <Circle size={19} />
              </span>
            </div>
            <div className="stat-card">
              <div>
                <span>Completed</span>
                <strong>
                  {done}
                  <small>small wins, big impact</small>
                </strong>
              </div>
              <span className="stat-icon green">
                <CircleCheck size={19} />
              </span>
            </div>
            <div className="stat-card completion-stat">
              <div>
                <span>Completion rate</span>
                <strong>
                  {completion}
                  <span className="percent">%</span>
                  <small>one step at a time</small>
                </strong>
              </div>
              <span
                className="progress-ring"
                style={{ '--progress': `${completion}%` } as CSSProperties}
              >
                <ArrowUpRight size={18} />
              </span>
            </div>
          </section>
          <section className="work-section" aria-label="Task workspace">
            <div className="work-heading">
              <div>
                <h2>
                  {completedOnly
                    ? 'Completed tasks'
                    : selectedProject
                      ? 'Project board'
                      : 'Your work, in view'}
                  <span>{filtered.length}</span>
                </h2>
                <p>
                  {completedOnly
                    ? 'Take a moment to appreciate the work.'
                    : 'A clear path from an idea to a job well done.'}
                </p>
              </div>
              <span className="board-hint">
                <Sparkles size={13} />
                {view === 'board'
                  ? 'Drag tasks to keep things moving'
                  : 'Click a task to make it yours'}
              </span>
            </div>
            <div className="toolbar">
              <div className="view-switch" aria-label="Task view">
                <button
                  aria-pressed={view === 'board'}
                  className={view === 'board' ? 'selected' : ''}
                  onClick={() => setView('board')}
                >
                  <Columns3 size={15} />
                  Board
                </button>
                <button
                  aria-pressed={view === 'list'}
                  className={view === 'list' ? 'selected' : ''}
                  onClick={() => setView('list')}
                >
                  <List size={16} />
                  List
                </button>
              </div>
              <div className="toolbar-controls">
                <label className="search-field">
                  <Search size={15} />
                  <input
                    ref={searchInput}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks…"
                    aria-label="Search tasks"
                  />
                  {query ? (
                    <button
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <kbd>⌘ K</kbd>
                  )}
                </label>
                <label
                  className={`priority-filter ${priority ? 'filter-active' : ''}`}
                >
                  <SlidersHorizontal size={14} />
                  <select
                    aria-label="Filter by priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="">All priorities</option>
                    {PRIORITIES.map((value) => (
                      <option key={value} value={value}>
                        {value} priority
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} />
                </label>
              </div>
            </div>
            {hasFilters && (
              <div className="filter-summary">
                {filtered.length} matching{' '}
                {filtered.length === 1 ? 'task' : 'tasks'}
                <button
                  className="text-button"
                  onClick={() => {
                    setQuery('');
                    setPriority('');
                  }}
                >
                  Clear filters
                  <X size={12} />
                </button>
              </div>
            )}

            {view === 'board' ? (
              <div
                className={`board ${completedOnly ? 'completed-board' : ''}`}
              >
                {STATUSES.filter(
                  (status) => !completedOnly || status === 'Done',
                ).map((status) => {
                  const tasks = filtered.filter(
                    (task) => task.status === status,
                  );
                  return (
                    <section
                      key={status}
                      aria-label={`${status} column`}
                      className={`board-column status-${STATUSES.indexOf(status)} ${dropTarget === status ? 'drop-target' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDropTarget(status);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node))
                          setDropTarget(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData('text/plain');
                        if (workspace.tasks.some((task) => task.id === id))
                          commit(
                            moveTask(workspace, id, status),
                            `Task moved to ${status}`,
                          );
                        setDropTarget(null);
                      }}
                    >
                      <div className="column-heading">
                        <span className="column-title">
                          <StatusIcon status={status} />
                          {status}
                          <span className="column-count">{tasks.length}</span>
                        </span>
                        <button
                          className="icon-button"
                          aria-label={`Add task to ${status}`}
                          onClick={() => openNew(status)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="column-tasks">
                        {tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            project={workspace.projects.find(
                              (project) => project.id === task.projectId,
                            )!}
                            onOpen={() =>
                              setEditor({ task, status: task.status })
                            }
                          />
                        ))}
                        {!tasks.length && (
                          <div className="column-empty">
                            <CircleDashed size={22} />
                            <p>
                              {hasFilters
                                ? 'No matching tasks'
                                : 'Room for the next step'}
                            </p>
                            <span>
                              {hasFilters
                                ? 'Try a different search or priority.'
                                : 'Add a task or drop one here.'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        className="column-add"
                        onClick={() => openNew(status)}
                      >
                        <Plus size={14} />
                        Add task
                      </button>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="task-table-wrap">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th scope="col">Task</th>
                      <th scope="col">Project</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Due date</th>
                      <th scope="col">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <button
                            className="table-task"
                            onClick={() =>
                              setEditor({ task, status: task.status })
                            }
                          >
                            <span>CON-{task.number}</span>
                            {task.title}
                          </button>
                        </td>
                        <td>
                          <span className="table-project">
                            <span
                              style={{
                                background: workspace.projects.find(
                                  (project) => project.id === task.projectId,
                                )!.color,
                              }}
                            />
                            {
                              workspace.projects.find(
                                (project) => project.id === task.projectId,
                              )!.name
                            }
                          </span>
                        </td>
                        <td>
                          <label
                            className={`table-status status-${STATUSES.indexOf(task.status)}`}
                          >
                            <StatusIcon status={task.status} />
                            <select
                              aria-label={`Status of ${task.title}`}
                              value={task.status}
                              onChange={(e) =>
                                commit(
                                  moveTask(
                                    workspace,
                                    task.id,
                                    e.target.value as Status,
                                  ),
                                  'Task status updated',
                                )
                              }
                            >
                              {STATUSES.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </label>
                        </td>
                        <td>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="table-date">
                          {task.dueDate ? dueLabel(task.dueDate) : '—'}
                        </td>
                        <td>
                          {task.assignee ? (
                            <Avatar name={task.assignee} />
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filtered.length && (
                  <div className="table-empty">
                    <Search size={26} />
                    <h3>No tasks here yet</h3>
                    <p>
                      {hasFilters
                        ? 'Try clearing your filters to see more tasks.'
                        : 'Start with one small step. Add your first task.'}
                    </p>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        hasFilters ? (setQuery(''), setPriority('')) : openNew()
                      }
                    >
                      {hasFilters ? 'Clear filters' : 'Create a task'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
          <footer className="page-footer">
            <span>
              <span className="mini-brand">c</span> Less busywork. More good
              work.
            </span>
            <span>
              Made for a little more harmony.
              <ArrowDown size={12} />
            </span>
          </footer>
        </div>
      </main>
      <div
        className={`toast ${announcement ? 'toast-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {announcement && (
          <>
            <Check size={16} />
            {announcement}
          </>
        )}
      </div>
      {editor && (
        <TaskEditor
          task={editor.task}
          projects={workspace.projects}
          defaultProject={projectId}
          defaultStatus={editor.status}
          onSave={saveTask}
          onClose={() => setEditor(null)}
          onDelete={() => {
            if (editor.task)
              commit(
                {
                  ...workspace,
                  tasks: workspace.tasks.filter(
                    (task) => task.id !== editor.task!.id,
                  ),
                },
                'Task deleted',
              );
            setEditor(null);
          }}
        />
      )}
      {projectEditor && (
        <ProjectEditor
          projects={workspace.projects}
          onClose={() => setProjectEditor(false)}
          onSave={(project) => {
            commit(
              { ...workspace, projects: [...workspace.projects, project] },
              'Project created',
            );
            navigate(project.id);
            setProjectEditor(false);
          }}
        />
      )}
    </div>
  );
}
