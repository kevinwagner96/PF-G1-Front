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
  UserCircle
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { apiRequest } from '@/lib/api'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  submenu?: { id: string; label: string; icon: React.ReactNode; href: string }[]
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  {
    id: 'cirugias',
    label: 'Cirugias',
    icon: <Calendar size={20} />,
    submenu: [
      { id: 'lista-cirugias', label: 'Lista de Cirugias', icon: <ClipboardList size={18} />, href: '/cirugias' },
      { id: 'agenda', label: 'Agenda Semanal', icon: <Calendar size={18} />, href: '/agenda' },
      { id: 'urgencias', label: 'Emergencias', icon: <AlertCircle size={18} />, href: '/emergencias' },
    ],
  },
  { id: 'mi-agenda', label: 'Mi Agenda', icon: <UserCircle size={20} />, href: '/mi-agenda' },
  { id: 'quirofanos', label: 'Quirofanos', icon: <Stethoscope size={20} />, href: '/quirofanos' },
  { id: 'personal', label: 'Personal', icon: <Users size={20} />, href: '/personal' },
  { id: 'insumos', label: 'Insumos', icon: <Package size={20} />, href: '/insumos' },
  { id: 'pacientes', label: 'Pacientes', icon: <UserCog size={20} />, href: '/pacientes' },
  { id: 'tipos-cirugia', label: 'Tipos de Cirugia', icon: <FileText size={20} />, href: '/tipos-cirugia' },
  { id: 'reportes', label: 'Reportes', icon: <FileText size={20} />, href: '/reportes' },
]

const mvpMenuItems: MenuItem[] = [
  {
    id: 'cirugias',
    label: 'Cirugias',
    icon: <Calendar size={20} />,
    submenu: [
      {
        id: 'lista-cirugias',
        label: 'Lista de Cirugias',
        icon: <ClipboardList size={18} />,
        href: '/mvp/cirugias',
      },
    ],
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
  const visibleMenuItems = navigationMode === 'mvp' ? mvpMenuItems : menuItems

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleResetDemo = async () => {
    const confirmed = window.confirm('Esto va a borrar la planificación actual y devolver las cirugías al estado pendiente. ¿Continuar?')
    if (!confirmed) return

    setIsResettingDemo(true)
    try {
      await apiRequest('/demo/reset/', { method: 'POST' })
      window.location.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo restablecer la demo'
      window.alert(message)
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Stethoscope size={24} className="text-blue-600" />
          <span>SurgiCare</span>
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.id}>
                <button
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
            onClick={handleResetDemo}
            disabled={isResettingDemo}
            className="mb-3 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:text-red-300"
          >
            <DatabaseBackup size={18} className="text-red-600" />
            <span className="flex-1 text-left text-sm font-medium">
              {isResettingDemo ? 'Restableciendo...' : 'Restablecer demo'}
            </span>
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
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Cerrar sesion"
          >
            <LogOut size={16} className="text-gray-400 hover:text-red-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
