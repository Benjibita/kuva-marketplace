'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

import { LayoutDashboard } from 'lucide-react'

export function UserMenu({ role }: { role?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-card transition hover:bg-kuva-surface active:scale-95"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-3xl border border-kuva-line bg-white py-1 shadow-card-hover">
          {role === 'vendor' && (
            <Link 
              href="/vendor/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 transition hover:bg-kuva-surface"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Vendor Dashboard
            </Link>
          )}
          <Link 
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 transition hover:bg-kuva-surface"
          >
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Link>
          <form action={logout}>
            <button 
              type="submit"
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
