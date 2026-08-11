'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftRight,
  DatabaseBackup,
  ChevronDown, 
  ChevronRight, 
  LayoutDashboard, 
  Calendar, 
  AlertCircle, 
  Stethoscope, 
  Users, 
  Package, 
  UserCog, 
  LogOut, 
  User,
  ClipboardList,
  FileText,
  Settings,
  UserCircle,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { apiRequest } from '@/lib/api'
import ConfirmActionDialog from '@/components/confirm-action-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'

const ACCESS_SYSTEM_ADMIN_PERMISSION = 'accounts.can_access_system_admin'
const CREATE_PLANNING_PERMISSION = 'plannings.can_create_planning'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://127.0.0.1:3010/admin/'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  submenu?: { id: string; label: string; icon: React.ReactNode; href: string }[]
  requiredPermission?: string
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  {
    id: 'cirugias',
    label: 'Cirugías',
    icon: <Calendar size={20} />,
    submenu: [
      { id: 'lista-cirugias', label: 'Lista de cirugías', icon: <ClipboardList size={18} />, href: '/cirugias' },
      { id: 'agenda', label: 'Agenda Semanal', icon: <Calendar size={18} />, href: '/agenda' },
      { id: 'urgencias', label: 'Emergencias', icon: <AlertCircle size={18} />, href: '/emergencias' },
    ],
  },
  { id: 'mi-agenda', label: 'Mi Agenda', icon: <UserCircle size={20} />, href: '/mi-agenda' },
  { id: 'quirofanos', label: 'Quirófanos', icon: <Stethoscope size={20} />, href: '/quirofanos' },
  { id: 'personal', label: 'Personal', icon: <Users size={20} />, href: '/personal' },
  { id: 'usuarios', label: 'Usuarios', icon: <ShieldCheck size={20} />, href: '/usuarios' },
  { id: 'insumos', label: 'Insumos', icon: <Package size={20} />, href: '/insumos' },
  { id: 'pacientes', label: 'Pacientes', icon: <UserCog size={20} />, href: '/pacientes' },
  { id: 'tipos-cirugia', label: 'Tipos de cirugía', icon: <FileText size={20} />, href: '/tipos-cirugia' },
]

const mvpMenuItems: MenuItem[] = [
  {
    id: 'cirugias',
    label: 'Cirugías',
    icon: <Calendar size={20} />,
    submenu: [
      {
        id: 'lista-cirugias',
        label: 'Lista de cirugías',
        icon: <ClipboardList size={18} />,
        href: '/mvp/cirugias',
      },
    ],
  },
  {
    id: 'personal',
    label: 'Horarios médicos',
    icon: <Users size={20} />,
    href: '/mvp/personal',
    requiredPermission: CREATE_PLANNING_PERMISSION,
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: <FileText size={20} />,
    href: '/mvp/reportes',
  },
]

interface SidebarProps {
  activePage?: string
  navigationMode?: 'mockup' | 'mvp'
}

export function Sidebar({ activePage = 'cirugias', navigationMode = 'mockup' }: SidebarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState<string | null>('cirugias')
  const [isResettingDemo, setIsResettingDemo] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const canAccessSystemAdmin = user?.permissions?.includes(ACCESS_SYSTEM_ADMIN_PERMISSION) ?? false
  const visibleMenuItems = (navigationMode === 'mvp' ? mvpMenuItems : menuItems).filter(
    (item) => !item.requiredPermission || user?.permissions?.includes(item.requiredPermission),
  )

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleResetDemo = async () => {
    setIsResettingDemo(true)
    try {
      await apiRequest('/demo/reset/', { method: 'POST' })
      toast({ title: 'Demo restablecida', description: 'Las planificaciones se eliminaron y las cirugías volvieron a Pendiente.' })
      setIsResetDialogOpen(false)
      window.location.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo restablecer la demo'
      toast({ title: 'No se pudo restablecer la demo', description: message, variant: 'destructive' })
      setIsResettingDemo(false)
    }
  }

  const isActive = (item: MenuItem): boolean => {
    if (item.id === activePage) return true
    if (item.submenu) {
      return item.submenu.some(sub => sub.id === activePage)
    }
    return false
  }

  const handleNavigation = (href?: string) => {
    if (href) {
      router.push(href)
    }
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white" aria-label="Navegación principal">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Stethoscope size={24} className="text-blue-600" />
          <span>SurgiCare</span>
        </h2>
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${navigationMode === 'mvp' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
          {navigationMode === 'mvp' ? 'MVP · datos reales' : 'Mockup · simulación'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-expanded={item.submenu ? expanded === item.id : undefined}
                  aria-current={!item.submenu && active ? 'page' : undefined}
                  onClick={() => {
                    if (item.submenu) {
                      setExpanded(expanded === item.id ? null : item.id)
                    } else {
                      handleNavigation(item.href)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-blue-600'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {item.submenu && (
                    <span className={active ? 'text-white' : 'text-gray-400'}>
                      {expanded === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  )}
                </button>

                {item.submenu && expanded === item.id && (
                  <ul className="ml-4 mt-1 space-y-1 border-l-2 border-blue-200 pl-2">
                    {item.submenu.map((subitem) => (
                      <li key={subitem.id}>
                        <button 
                          type="button"
                          aria-current={activePage === subitem.id ? 'page' : undefined}
                          onClick={() => handleNavigation(subitem.href)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg ${
                            activePage === subitem.id 
                              ? 'text-blue-600 bg-blue-50 font-medium' 
                              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className={activePage === subitem.id ? 'text-blue-600' : 'text-gray-400'}>
                            {subitem.icon}
                          </span>
                          {subitem.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push('/seleccionar-experiencia')}
          className="mb-2 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftRight size={18} className="text-blue-600" />
          <span className="flex-1 text-left text-sm font-medium">Cambiar modo</span>
        </button>
        {navigationMode === 'mvp' && (
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            disabled={isResettingDemo}
            className="mb-3 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:text-red-300"
          >
            <DatabaseBackup size={18} className="text-red-600" />
            <span className="flex-1 text-left text-sm font-medium">
              {isResettingDemo ? 'Restableciendo...' : 'Restablecer demo'}
            </span>
          </button>
        )}
        {canAccessSystemAdmin && (
          <button
            type="button"
            onClick={() => window.open(ADMIN_URL, '_blank', 'noopener,noreferrer')}
            className="mb-3 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings size={18} className="text-blue-600" />
            <span className="flex-1 text-left text-sm font-medium">Administración del sistema</span>
          </button>
        )}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <User size={18} />
          </div>
          <div className="flex-1 text-sm min-w-0">
            <p className="font-medium text-gray-900 truncate">{user?.nombre || 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.rol || 'Sin rol'}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-600"
                aria-label="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Cerrar sesión</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ConfirmActionDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        title="Restablecer datos de la demo"
        description="Se eliminará la planificación actual y todas las cirugías demo volverán al estado Pendiente. Esta acción no se puede deshacer."
        confirmLabel="Restablecer demo"
        busyLabel="Restableciendo..."
        busy={isResettingDemo}
        onConfirm={handleResetDemo}
      />
    </aside>
  )
}

export default Sidebar
