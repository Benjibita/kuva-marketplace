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
        className="flex items-center justify-center bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
      >
        <User className="w-5 h-5 text-gray-700" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {role === 'vendor' && (
            <Link 
              href="/vendor/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Vendor Dashboard
            </Link>
          )}
          <Link 
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
