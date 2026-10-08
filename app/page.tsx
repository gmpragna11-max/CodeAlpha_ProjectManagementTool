'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  ListFilter,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications, type NotificationItem } from '@/components/notification-provider'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

type Status = 'Todo' | 'In Progress' | 'Review' | 'Done'
type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'
type View = 'Dashboard' | 'Projects' | 'My tasks' | 'Notifications' | 'Project details'
type BoardTab = 'Board' | 'List' | 'Activity'
type TaskComment = { id: string; user: string; message: string; createdAt: string }
type Task = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  projectId: string
  dueDate: string
  assignee: string
  initials: string
  color: string
  comments: TaskComment[]
  labels: string[]
}
type Project = {
  id: string
  name: string
  description: string
  status: 'On track' | 'At risk' | 'Blocked' | 'Completed'
  startDate: string
  dueDate: string
  members: string[]
}
type ActivityItem = { id: string; message: string; user: string; createdAt: string; type: string }
type SharedUpdate = {
  id: string
  title: string
  message: string
  status: Project['status']
  projectId: string
  createdAt: string
}

const CURRENT_USER = 'Maya Chen'
const TASKS_KEY = 'taskflow-tasks'
const PROJECTS_KEY = 'taskflow-projects'
const ACTIVITY_KEY = 'taskflow-activity'
const UPDATES_KEY = 'taskflow-updates'
const dateAt = (day: number) => `2026-10-${String(day).padStart(2, '0')}`
const statusOptions: Status[] = ['Todo', 'In Progress', 'Review', 'Done']
const priorityOptions: Priority[] = ['Urgent', 'High', 'Medium', 'Low']

const defaultProjects: Project[] = [
  { id: 'website-redesign', name: 'Website redesign', description: 'Refresh the TaskFlow marketing site and product experience.', status: 'On track', startDate: dateAt(1), dueDate: dateAt(30), members: ['Maya Chen', 'Alex Morgan', 'Priya Shah', 'Noah Williams'] },
  { id: 'mobile-app', name: 'Mobile app', description: 'Design and build the next-generation mobile experience.', status: 'At risk', startDate: dateAt(1), dueDate: dateAt(28), members: ['Maya Chen', 'Omar Hassan'] },
  { id: 'operations', name: 'Operations', description: 'Improve internal processes, templates, and team workflows.', status: 'On track', startDate: dateAt(1), dueDate: dateAt(31), members: ['Maya Chen', 'Omar Hassan'] },
  { id: 'platform', name: 'Platform', description: 'Build a dependable foundation for the TaskFlow product.', status: 'On track', startDate: dateAt(1), dueDate: dateAt(31), members: ['Alex Morgan', 'Omar Hassan'] },
]

const defaultTasks: Task[] = [
  { id: '1', title: 'Design login experience', description: 'Create the new authentication flow and review responsive states.', status: 'Todo', priority: 'High', projectId: 'website-redesign', dueDate: dateAt(10), assignee: 'Alex Morgan', initials: 'AM', color: 'bg-violet-500', comments: [], labels: ['Design', 'Frontend'] },
  { id: '2', title: 'Set up analytics events', description: 'Track activation, workspace creation, and project completion events.', status: 'Todo', priority: 'Medium', projectId: 'website-redesign', dueDate: dateAt(12), assignee: 'Priya Shah', initials: 'PS', color: 'bg-amber-500', comments: [], labels: ['Analytics'] },
  { id: '3', title: 'Build dashboard overview', description: 'Turn the approved dashboard designs into reusable React components.', status: 'In Progress', priority: 'Urgent', projectId: 'website-redesign', dueDate: dateAt(8), assignee: CURRENT_USER, initials: 'MC', color: 'bg-rose-500', comments: [], labels: ['Frontend', 'Core'] },
  { id: '4', title: 'Write onboarding copy', description: 'Draft friendly copy for the first-run workspace setup experience.', status: 'In Progress', priority: 'Low', projectId: 'website-redesign', dueDate: dateAt(14), assignee: 'Noah Williams', initials: 'NW', color: 'bg-sky-500', comments: [], labels: ['Content'] },
  { id: '5', title: 'Review API documentation', description: 'Check endpoint examples and update the public API reference.', status: 'Review', priority: 'Medium', projectId: 'platform', dueDate: dateAt(9), assignee: 'Alex Morgan', initials: 'AM', color: 'bg-violet-500', comments: [], labels: ['Docs', 'API'] },
  { id: '6', title: 'Connect billing portal', description: 'Add the customer portal link and test subscription management.', status: 'Review', priority: 'High', projectId: 'platform', dueDate: dateAt(11), assignee: 'Omar Hassan', initials: 'OH', color: 'bg-emerald-500', comments: [], labels: ['Billing'] },
  { id: '7', title: 'Set up project templates', description: 'Create reusable project starter templates for new teams.', status: 'Done', priority: 'Medium', projectId: 'operations', dueDate: dateAt(4), assignee: CURRENT_USER, initials: 'MC', color: 'bg-rose-500', comments: [], labels: ['Product'] },
  { id: '8', title: 'Audit permissions model', description: 'Validate workspace roles and project-level access rules.', status: 'Done', priority: 'Urgent', projectId: 'platform', dueDate: dateAt(2), assignee: 'Omar Hassan', initials: 'OH', color: 'bg-emerald-500', comments: [], labels: ['Security'] },
]

const columns: { title: Status; color: string }[] = [
  { title: 'Todo', color: 'bg-slate-400' },
  { title: 'In Progress', color: 'bg-blue-500' },
  { title: 'Review', color: 'bg-amber-500' },
  { title: 'Done', color: 'bg-emerald-500' },
]

function safeRead<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value as T : fallback
  } catch {
    return fallback
  }
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Just now'
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function formattedDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Avatar({ initials, color, small = false }: { initials: string; color: string; small?: boolean }) {
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-card', small ? 'size-6' : 'size-8', color)}>{initials}</span>
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} className={cn('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl sm:p-6', wide ? 'max-w-2xl' : 'max-w-xl')} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-5" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

export default function Page() {
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [projects, setProjects] = useState<Project[]>(defaultProjects)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [updates, setUpdates] = useState<SharedUpdate[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeView, setActiveView] = useState<View>('Dashboard')
  const [boardTab, setBoardTab] = useState<BoardTab>('Board')
  const [selectedProjectId, setSelectedProjectId] = useState('website-redesign')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('All priorities')
  const [taskFilter, setTaskFilter] = useState<'All' | Status>('All')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [modal, setModal] = useState<'task' | 'project' | 'update' | 'members' | null>(null)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<Priority>('Medium')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectStatus, setProjectStatus] = useState<Project['status']>('On track')
  const [projectStartDate, setProjectStartDate] = useState('')
  const [projectDueDate, setProjectDueDate] = useState('')
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateStatus, setUpdateStatus] = useState<Project['status']>('On track')
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    setTasks(safeRead(TASKS_KEY, defaultTasks))
    setProjects(safeRead(PROJECTS_KEY, defaultProjects))
    setActivity(safeRead(ACTIVITY_KEY, []))
    setUpdates(safeRead(UPDATES_KEY, []))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
    localStorage.setItem(UPDATES_KEY, JSON.stringify(updates))
  }, [activity, loaded, projects, tasks, updates])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0]
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const currentTime = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const matchingTasks = useMemo(() => tasks.filter((task) => {
    const projectNameForTask = projects.find((project) => project.id === task.projectId)?.name ?? ''
    const searchText = `${task.title} ${task.description} ${projectNameForTask} ${task.assignee}`.toLowerCase()
    return searchText.includes(query.trim().toLowerCase()) && (priority === 'All priorities' || task.priority === priority)
  }), [priority, projects, query, tasks])
  const myTasks = matchingTasks.filter((task) => task.assignee === CURRENT_USER && (taskFilter === 'All' || task.status === taskFilter))
  const upcomingTasks = tasks.filter((task) => task.status !== 'Done' && task.dueDate && new Date(`${task.dueDate}T23:59:59`).getTime() >= startOfToday.getTime()).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)
  const completedCount = tasks.filter((task) => task.status === 'Done').length
  const activeCount = tasks.filter((task) => task.status !== 'Done').length
  const dueSoonCount = tasks.filter((task) => task.status !== 'Done' && task.dueDate && new Date(`${task.dueDate}T23:59:59`).getTime() >= currentTime && new Date(`${task.dueDate}T00:00:00`).getTime() <= currentTime + 7 * 86400000).length

  function addActivity(message: string, type: string) {
    setActivity((current) => [{ id: crypto.randomUUID(), message, user: CURRENT_USER, createdAt: new Date().toISOString(), type }, ...current])
  }

  function setView(view: View) {
    setActiveView(view)
    setSidebarOpen(false)
    setNotificationOpen(false)
    if (view === 'Project details' && !selectedProjectId && projects[0]) setSelectedProjectId(projects[0].id)
  }

  function openTask(taskId: string) {
    setSelectedTaskId(taskId)
    setModal('task')
    setNotificationOpen(false)
  }

  function changeTaskStatus(taskId: string, status: Status) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.status === status) return
    setTasks((current) => current.map((item) => item.id === taskId ? { ...item, status } : item))
    addActivity(`Maya moved '${task.title}' from ${task.status} to ${status}.`, 'task-status')
    if (task.assignee !== CURRENT_USER) {
      addNotification({
        id: crypto.randomUUID(),
        type: 'TASK_STATUS_CHANGED',
        message: `Your task '${task.title}' was moved to ${status.toUpperCase()}.`,
        projectId: task.projectId,
        projectName: projects.find((project) => project.id === task.projectId)?.name,
        taskId: task.id,
        taskTitle: task.title,
        createdAt: new Date().toISOString(),
      })
    }
  }

  function changeTaskPriority(taskId: string, nextPriority: Priority) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.priority === nextPriority) return
    setTasks((current) => current.map((item) => item.id === taskId ? { ...item, priority: nextPriority } : item))
    addActivity(`Maya changed priority of '${task.title}' to ${nextPriority}.`, 'task-priority')
  }

  function createTask() {
    const cleanTitle = taskTitle.trim()
    if (!cleanTitle || saving) return
    setSaving(true)
    const task: Task = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      description: taskDescription.trim() || 'A new task added to the project.',
      status: 'Todo',
      priority: taskPriority,
      projectId: selectedProject?.id ?? defaultProjects[0].id,
      dueDate: dateAt(18),
      assignee: CURRENT_USER,
      initials: 'MC',
      color: 'bg-rose-500',
      comments: [],
      labels: ['New'],
    }
    setTasks((current) => [...current, task])
    addActivity(`Maya created task '${cleanTitle}'.`, 'task-created')
    setTaskTitle('')
    setTaskDescription('')
    setTaskPriority('Medium')
    setModal(null)
    setSaving(false)
    setToast('Task created')
  }

  function createProject() {
    const cleanName = projectName.trim()
    if (!cleanName || saving) return
    if (projects.some((project) => project.name.toLowerCase() === cleanName.toLowerCase())) {
      setToast('A project with that name already exists')
      return
    }
    setSaving(true)
    const project: Project = {
      id: crypto.randomUUID(),
      name: cleanName,
      description: projectDescription.trim(),
      status: projectStatus,
      startDate: projectStartDate || new Date().toISOString().slice(0, 10),
      dueDate: projectDueDate || dateAt(30),
      members: [CURRENT_USER],
    }
    setProjects((current) => [...current, project])
    setSelectedProjectId(project.id)
    addActivity(`Maya created project '${cleanName}'.`, 'project-created')
    setProjectName('')
    setProjectDescription('')
    setProjectStatus('On track')
    setProjectStartDate('')
    setProjectDueDate('')
    setModal(null)
    setSaving(false)
    setToast('Project created')
  }

  function addComment() {
    const cleanMessage = commentText.trim()
    if (!selectedTask || !cleanMessage) return
    const comment: TaskComment = { id: crypto.randomUUID(), user: CURRENT_USER, message: cleanMessage, createdAt: new Date().toISOString() }
    setTasks((current) => current.map((task) => task.id === selectedTask.id ? { ...task, comments: [...task.comments, comment] } : task))
    addActivity(`Maya commented on '${selectedTask.title}'.`, 'comment')
    if (selectedTask.assignee !== CURRENT_USER) {
      addNotification({
        id: crypto.randomUUID(),
        type: 'COMMENT_ADDED',
        message: `Maya commented on your task '${selectedTask.title}'.`,
        projectId: selectedTask.projectId,
        projectName: projects.find((project) => project.id === selectedTask.projectId)?.name,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        createdAt: new Date().toISOString(),
      })
    }
    setCommentText('')
  }

  function shareUpdate() {
    const cleanTitle = updateTitle.trim()
    const cleanMessage = updateMessage.trim()
    if (!cleanTitle || !cleanMessage || saving || !selectedProject) return
    setSaving(true)
    const update: SharedUpdate = { id: crypto.randomUUID(), title: cleanTitle, message: cleanMessage, status: updateStatus, projectId: selectedProject.id, createdAt: new Date().toISOString() }
    setUpdates((current) => [update, ...current])
    addActivity(`Maya shared project update '${cleanTitle}'.`, 'project-update')
    setUpdateTitle('')
    setUpdateMessage('')
    setUpdateStatus('On track')
    setModal(null)
    setSaving(false)
    setToast('Update shared')
  }

  function openProject(projectId: string) {
    setSelectedProjectId(projectId)
    setView('Project details')
  }

  function notificationClicked(notification: NotificationItem) {
    markAsRead(notification.id)
    if (notification.taskId && tasks.some((task) => task.id === notification.taskId)) openTask(notification.taskId)
  }

  const navItems = [
    { label: 'Dashboard' as View, icon: LayoutDashboard },
    { label: 'Projects' as View, icon: FolderKanban },
    { label: 'My tasks' as View, icon: ClipboardList },
    { label: 'Notifications' as View, icon: Bell },
  ]

  function TaskCard({ task }: { task: Task }) {
    return (
      <article draggable onDragStart={(event) => event.dataTransfer.setData('taskId', task.id)} onClick={() => openTask(task.id)} className="cursor-pointer rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <span className={cn('rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide', task.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600' : task.priority === 'High' ? 'bg-orange-500/10 text-orange-600' : task.priority === 'Medium' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground')}>{task.priority}</span>
          <button type="button" aria-label={`Open ${task.title}`} onClick={(event) => { event.stopPropagation(); openTask(task.id) }} className="rounded p-1 text-muted-foreground hover:bg-muted"><MoreHorizontal className="size-4" /></button>
        </div>
        <h4 className="mt-3 text-sm font-semibold leading-snug">{task.title}</h4>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{task.labels.map((label) => <span key={label} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{label}</span>)}</div>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="size-3.5" />{formattedDate(task.dueDate)}</span>
          <span className="flex items-center gap-3 text-muted-foreground"><span className="flex items-center gap-1 text-[11px]"><MessageSquare className="size-3.5" />{task.comments.length}</span><Avatar initials={task.initials} color={task.color} small /></span>
        </div>
      </article>
    )
  }

  function TaskList({ items }: { items: Task[] }) {
    if (!items.length) return <EmptyState title="No tasks found" detail="Try changing your search or filters." />
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{['Task', 'Project', 'Status', 'Priority', 'Assignee', 'Due date', 'Comments'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody>{items.map((task) => (
            <tr key={task.id} onClick={() => openTask(task.id)} className="cursor-pointer border-t border-border hover:bg-muted/40">
              <td className="px-4 py-3"><p className="font-medium">{task.title}</p><p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{task.description}</p></td>
              <td className="px-4 py-3 text-muted-foreground">{projects.find((project) => project.id === task.projectId)?.name ?? 'Unknown project'}</td>
              <td className="px-4 py-3"><select value={task.status} onClick={(event) => event.stopPropagation()} onChange={(event) => changeTaskStatus(task.id, event.target.value as Status)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></td>
              <td className="px-4 py-3"><select value={task.priority} onClick={(event) => event.stopPropagation()} onChange={(event) => changeTaskPriority(task.id, event.target.value as Priority)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></td>
              <td className="px-4 py-3"><span className="flex items-center gap-2"><Avatar initials={task.initials} color={task.color} small />{task.assignee}</span></td>
              <td className="px-4 py-3 text-muted-foreground">{formattedDate(task.dueDate)}</td>
              <td className="px-4 py-3 text-muted-foreground">{task.comments.length}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    )
  }

  function EmptyState({ title, detail }: { title: string; detail: string }) {
    return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>
  }

  function ActivityFeed() {
    return (
      <div className="space-y-3">
        {updates.map((update) => (
          <article key={update.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{update.title}</p><p className="mt-1 text-xs text-muted-foreground">{CURRENT_USER} · {projects.find((project) => project.id === update.projectId)?.name ?? 'Project'} · {relativeTime(update.createdAt)}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{update.status}</span></div>
            <p className="mt-3 text-sm text-muted-foreground">{update.message}</p>
          </article>
        ))}
        {activity.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Activity className="size-4" /></div>
            <div className="min-w-0 flex-1"><p className="text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{item.user} · {relativeTime(item.createdAt)}</p></div>
          </div>
        ))}
        {!updates.length && !activity.length && <EmptyState title="No activity yet" detail="Task and project changes will appear here." />}
      </div>
    )
  }

  const projectTasks = selectedProject ? matchingTasks.filter((task) => task.projectId === selectedProject.id) : []
  const projectAllTasks = selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id) : []
  const projectCompleted = projectAllTasks.filter((task) => task.status === 'Done').length
  const projectProgress = projectAllTasks.length ? Math.round((projectCompleted / projectAllTasks.length) * 100) : 0
  const contentTitle = activeView === 'Project details' ? selectedProject?.name ?? 'Project' : activeView

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar p-5 transition-transform lg:static lg:translate-x-0', sidebarOpen && 'translate-x-0')}>
          <div className="flex items-center gap-3 px-2"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-5" /></div><span className="text-lg font-bold tracking-tight">Task<span className="text-primary">Flow</span></span><button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X className="size-5" /></button></div>
          <div className="mt-10"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p><nav className="mt-3 flex flex-col gap-1">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setView(label)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors', activeView === label ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}><Icon className="size-[18px]" />{label}{label === 'Notifications' && unreadCount > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>}</button>)}</nav></div>
          <div className="mt-8"><div className="flex items-center justify-between px-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Projects</p><button onClick={() => { setModal('project'); setSidebarOpen(false) }} aria-label="Create project" className="text-muted-foreground hover:text-foreground"><Plus className="size-4" /></button></div><div className="mt-3 flex flex-col gap-1">{projects.slice(0, 5).map((project) => <button key={project.id} onClick={() => openProject(project.id)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm', selectedProjectId === project.id ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent')}><span className="size-2 rounded-full bg-violet-500" /> <span className="truncate">{project.name}</span><span className="ml-auto text-xs">{tasks.filter((task) => task.projectId === project.id).length}</span></button>)}</div></div>
          <div className="mt-auto flex flex-col gap-1"><button disabled title="Coming soon" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground opacity-60"><Settings className="size-[18px]" />Settings <span className="ml-auto text-[10px]">Coming soon</span></button><button disabled title="Coming soon" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground opacity-60"><CircleHelp className="size-[18px]" />Help center <span className="ml-auto text-[10px]">Coming soon</span></button><div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4"><Avatar initials="MC" color="bg-rose-500" /><div className="min-w-0"><p className="truncate text-sm font-medium">{CURRENT_USER}</p><p className="truncate text-xs text-muted-foreground">maya@taskflow.io</p></div><MoreHorizontal className="ml-auto size-4 text-muted-foreground" /></div></div>
        </aside>
        {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu overlay" />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md lg:px-8">
            <div className="flex min-w-0 items-center gap-3"><button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button><div className="relative hidden w-64 sm:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" /></div><h1 className="truncate text-sm font-semibold sm:hidden">{contentTitle}</h1></div>
            <div className="flex items-center gap-2">
              <div className="relative"><button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setNotificationOpen((current) => !current)} aria-label="Notifications"><Bell className="size-5" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}</button>
                {notificationOpen && <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"><div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-semibold">Notifications</p><span className="text-xs text-muted-foreground">{unreadCount} unread</span></div><div className="max-h-[380px] overflow-y-auto p-2">{notifications.length ? notifications.slice(0, 6).map((notification) => <button key={notification.id} onClick={() => notificationClicked(notification)} className={cn('mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left', notification.isRead ? 'hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10')}><span className={cn('mt-1 size-2 shrink-0 rounded-full', notification.isRead ? 'bg-transparent' : 'bg-primary')} /><span className="min-w-0 flex-1"><span className="block text-sm">{notification.message}</span><span className="mt-1 block text-[11px] text-muted-foreground">{relativeTime(notification.createdAt)}</span></span></button>) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>}</div><div className="flex items-center justify-between border-t border-border px-3 py-2"><button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Mark all as read</button><button onClick={() => setView('Notifications')} className="text-xs text-muted-foreground hover:text-foreground">View all</button></div></div>}</div>
              <button onClick={toggleTheme} className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}<span className="hidden text-sm sm:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
              <div className="ml-1 hidden items-center gap-2 border-l border-border pl-3 sm:flex"><Avatar initials="MC" color="bg-rose-500" small /><ChevronDown className="size-3.5 text-muted-foreground" /></div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">{contentTitle}</h1><p className="mt-1 text-sm text-muted-foreground">{activeView === 'Dashboard' ? 'Here’s what’s happening across your workspace.' : activeView === 'My tasks' ? 'Tasks assigned to you.' : activeView === 'Notifications' ? 'Stay up to date with your workspace.' : activeView === 'Projects' ? 'Track your team’s projects and progress.' : selectedProject?.description}</p></div>
              <div className="flex flex-wrap gap-2">{activeView !== 'Notifications' && <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"><ListFilter className="size-4 text-muted-foreground" /><select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="max-w-36 bg-transparent outline-none"><option>All priorities</option>{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></div>}{activeView !== 'Notifications' && activeView !== 'Projects' && <Button variant="outline" onClick={() => { setTaskTitle(''); setTaskDescription(''); setModal('task') }}><Plus data-icon="inline-start" />Create task</Button>}{activeView === 'Projects' && <Button onClick={() => setModal('project')}><Plus data-icon="inline-start" />Create project</Button>}{activeView === 'Project details' && <Button variant="outline" onClick={() => setModal('members')}><Users data-icon="inline-start" />Members</Button>}{activeView === 'Project details' && <Button onClick={() => setModal('update')}>Share updates</Button>}</div>
            </div>

            {activeView === 'Dashboard' && <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[{ label: 'Total projects', value: projects.length, Icon: FolderKanban, tone: 'text-violet-600 bg-violet-500/10' }, { label: 'Active tasks', value: activeCount, Icon: ClipboardList, tone: 'text-blue-600 bg-blue-500/10' }, { label: 'Completed tasks', value: completedCount, Icon: Check, tone: 'text-emerald-600 bg-emerald-500/10' }, { label: 'Due soon', value: dueSoonCount, Icon: Clock3, tone: 'text-amber-600 bg-amber-500/10' }].map(({ label, value, Icon, tone }) => <div key={label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><div className={cn('flex size-10 items-center justify-center rounded-xl', tone)}><Icon className="size-5" /></div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
              </section>
              <section className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-border/70 bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Project progress</h2><p className="mt-1 text-xs text-muted-foreground">Completed tasks across all projects</p></div><span className="text-2xl font-semibold">{tasks.length ? Math.round(completedCount / tasks.length * 100) : 0}%</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tasks.length ? completedCount / tasks.length * 100 : 0}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{completedCount} of {tasks.length} tasks completed</p></div>
                <div className="rounded-2xl border border-border/70 bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Upcoming deadlines</h2><p className="mt-1 text-xs text-muted-foreground">Open a task to see its details</p></div><CalendarDays className="size-5 text-muted-foreground" /></div>{upcomingTasks.length ? <div className="space-y-2">{upcomingTasks.map((task) => <button key={task.id} onClick={() => openTask(task.id)} className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left hover:bg-muted/60"><span className="min-w-0"><span className="block truncate text-sm font-medium">{task.title}</span><span className="text-xs text-muted-foreground">{projects.find((project) => project.id === task.projectId)?.name}</span></span><span className="shrink-0 text-xs text-muted-foreground">{formattedDate(task.dueDate)}</span></button>)}</div> : <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>}</div></section>
              <section className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-border/70 bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent activity</h2><button onClick={() => { setView('Project details'); setBoardTab('Activity') }} className="text-sm text-primary hover:underline">View activity</button></div><ActivityFeed /></div><div className="rounded-2xl border border-border/70 bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Projects</h2><button onClick={() => setView('Projects')} className="text-sm text-primary hover:underline">View all</button></div><div className="space-y-2">{projects.slice(0, 4).map((project) => <button key={project.id} onClick={() => openProject(project.id)} className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-muted/60"><span className="font-medium">{project.name}</span><span className="text-xs text-muted-foreground">{tasks.filter((task) => task.projectId === project.id).length} tasks</span></button>)}</div></div></section>
            </>}

            {activeView === 'Projects' && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{projects.map((project) => { const projectTasksForCard = tasks.filter((task) => task.projectId === project.id); const done = projectTasksForCard.filter((task) => task.status === 'Done').length; const progress = projectTasksForCard.length ? Math.round(done / projectTasksForCard.length * 100) : 0; return <button key={project.id} onClick={() => openProject(project.id)} className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><FolderKanban className="size-5" /></span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{project.status}</span></div><h2 className="mt-4 font-semibold">{project.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{project.description}</p><div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{projectTasksForCard.length} tasks · {done} completed</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="flex -space-x-1">{project.members.slice(0, 4).map((member) => <Avatar key={member} initials={member.split(' ').map((part) => part[0]).join('')} color="bg-violet-500" small />)}</span><span className="text-xs text-muted-foreground">Due {formattedDate(project.dueDate)}</span></div></button> })}</section>}

            {activeView === 'Project details' && selectedProject && <><section className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{selectedProject.status}</span><p className="mt-3 max-w-2xl text-sm text-muted-foreground">{selectedProject.description}</p><p className="mt-3 text-xs text-muted-foreground">{selectedProject.members.length} members · {projectAllTasks.length} tasks · Due {formattedDate(selectedProject.dueDate)}</p></div><div className="text-right"><p className="text-2xl font-semibold">{projectProgress}%</p><p className="text-xs text-muted-foreground">{projectCompleted} completed</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${projectProgress}%` }} /></div></section>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border"><div className="flex gap-5">{(['Board', 'List', 'Activity'] as BoardTab[]).map((tab) => <button key={tab} onClick={() => setBoardTab(tab)} className={cn('border-b-2 pb-3 text-sm', boardTab === tab ? 'border-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>{tab}</button>)}</div>{boardTab === 'Activity' && <Button variant="outline" className="mb-2" onClick={() => setModal('update')}>Share updates</Button>}</div>
              <div className="mt-5">{boardTab === 'Board' && <section className="grid min-w-0 gap-4 overflow-x-auto pb-4 md:grid-cols-2 xl:grid-cols-4">{columns.map((column) => <div key={column.title} className="min-w-[250px] rounded-2xl bg-muted/45 p-3"><div className="flex items-center gap-2 px-1 py-1"><span className={cn('size-2 rounded-full', column.color)} /><h3 className="text-sm font-semibold">{column.title}</h3><span className="text-xs text-muted-foreground">{projectTasks.filter((task) => task.status === column.title).length}</span></div><div className="mt-3 flex min-h-28 flex-col gap-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData('taskId'); if (id) changeTaskStatus(id, column.title) }}>{projectTasks.filter((task) => task.status === column.title).map((task) => <TaskCard key={task.id} task={task} />)}</div>{column.title === 'Todo' && <button onClick={() => { setTaskTitle(''); setTaskDescription(''); setModal('task') }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-card"><Plus className="size-3.5" />Add task</button>}</div>)}</section>}{boardTab === 'List' && <TaskList items={projectTasks} />}{boardTab === 'Activity' && <ActivityFeed />}</div>
            </>}

            {activeView === 'My tasks' && <><div className="mb-4 flex flex-wrap gap-2">{(['All', ...statusOptions] as ('All' | Status)[]).map((filter) => <button key={filter} onClick={() => setTaskFilter(filter)} className={cn('rounded-full border px-3 py-1.5 text-xs', taskFilter === filter ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted')}>{filter}</button>)}</div><TaskList items={myTasks} /></>}

            {activeView === 'Notifications' && <section className="mx-auto max-w-3xl"><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{notifications.length} notifications · {unreadCount} unread</p><Button variant="outline" onClick={markAllAsRead} disabled={!unreadCount}>Mark all as read</Button></div>{notifications.length ? <div className="space-y-2">{notifications.map((notification) => <div key={notification.id} className={cn('flex items-start gap-3 rounded-xl border p-4', notification.isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/5')}><div className={cn('mt-1 size-2 shrink-0 rounded-full', notification.isRead ? 'bg-transparent' : 'bg-primary')} /><button onClick={() => notificationClicked(notification)} className="min-w-0 flex-1 text-left"><p className="text-sm">{notification.message}</p><p className="mt-1 text-xs text-muted-foreground">{relativeTime(notification.createdAt)}{notification.projectName ? ` · ${notification.projectName}` : ''}</p></button><button aria-label="Delete notification" onClick={() => deleteNotification(notification.id)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button></div>)}</div> : <EmptyState title="No notifications yet." detail="You're all caught up." />}</section>}
          </div>
        </main>
      </div>

      {modal === 'task' && <Modal title={selectedTask ? selectedTask.title : 'Create a task'} onClose={() => setModal(null)}>
        {selectedTask ? <><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{projects.find((project) => project.id === selectedTask.projectId)?.name ?? 'Project'}</span><span>·</span><span>{selectedTask.assignee}</span><span>·</span><span>Due {formattedDate(selectedTask.dueDate)}</span></div><p className="mt-4 text-sm text-muted-foreground">{selectedTask.description}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-muted-foreground">Status<select value={selectedTask.status} onChange={(event) => changeTaskStatus(selectedTask.id, event.target.value as Status)} className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Priority<select value={selectedTask.priority} onChange={(event) => changeTaskPriority(selectedTask.id, event.target.value as Priority)} className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="mt-6 rounded-xl bg-muted/50 p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium">Comments</p><span className="text-xs text-muted-foreground">{selectedTask.comments.length}</span></div><div className="mt-3 max-h-40 space-y-3 overflow-y-auto">{selectedTask.comments.map((comment) => <div key={comment.id} className="rounded-lg bg-card p-3"><p className="text-xs font-medium">{comment.user} <span className="ml-2 font-normal text-muted-foreground">{relativeTime(comment.createdAt)}</span></p><p className="mt-1 text-sm">{comment.message}</p></div>)}</div><div className="mt-3 flex gap-2"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addComment() }} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" /><Button size="sm" onClick={addComment} disabled={!commentText.trim()}>Send</Button></div></div><div className="mt-5 flex justify-end"><Button variant="outline" onClick={() => setModal(null)}>Close</Button></div></> :
          <><label className="mb-4 block text-sm font-medium">Task title<input autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" placeholder="e.g. Prepare sprint retrospective" /></label><label className="mb-4 block text-sm font-medium">Description<textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" rows={3} /></label><label className="block text-sm font-medium">Priority<select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as Priority)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={createTask} disabled={!taskTitle.trim() || saving}>Create task</Button></div></>}
      </Modal>}

      {modal === 'project' && <Modal title="Create project" onClose={() => setModal(null)}><label className="mb-4 block text-sm font-medium">Project name *<input autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="mb-4 block text-sm font-medium">Description<textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="mb-4 block text-sm font-medium">Status<select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as Project['status'])} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">{['On track', 'At risk', 'Blocked', 'Completed'].map((item) => <option key={item}>{item}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Start date<input type="date" value={projectStartDate} onChange={(event) => setProjectStartDate(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="text-sm font-medium">Due date<input type="date" value={projectDueDate} onChange={(event) => setProjectDueDate(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={createProject} disabled={!projectName.trim() || saving}>Create project</Button></div></Modal>}

      {modal === 'update' && selectedProject && <Modal title="Share project update" onClose={() => setModal(null)}><label className="mb-4 block text-sm font-medium">Update title<input autoFocus value={updateTitle} onChange={(event) => setUpdateTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="mb-4 block text-sm font-medium">Update message<textarea value={updateMessage} onChange={(event) => setUpdateMessage(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" /></label><label className="block text-sm font-medium">Status<select value={updateStatus} onChange={(event) => setUpdateStatus(event.target.value as Project['status'])} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">{['On track', 'At risk', 'Blocked', 'Completed'].map((item) => <option key={item}>{item}</option>)}</select></label><p className="mt-3 text-xs text-muted-foreground">Sharing to {selectedProject.name}</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button onClick={shareUpdate} disabled={!updateTitle.trim() || !updateMessage.trim() || saving}>Share update</Button></div></Modal>}

      {modal === 'members' && selectedProject && <Modal title={`${selectedProject.name} members`} onClose={() => setModal(null)}><div className="space-y-2">{selectedProject.members.map((member) => <div key={member} className="flex items-center gap-3 rounded-lg border border-border p-3"><Avatar initials={member.split(' ').map((part) => part[0]).join('')} color="bg-violet-500" /><span className="text-sm">{member}</span>{member === CURRENT_USER && <span className="ml-auto text-xs text-muted-foreground">You</span>}</div>)}</div><div className="mt-5 flex justify-end"><Button onClick={() => setModal(null)}>Done</Button></div></Modal>}

      {toast && <div role="status" className="fixed bottom-5 right-5 z-[80] rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg">{toast}</div>}
    </div>
  )
}
