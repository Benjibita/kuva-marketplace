'use client'

import { useEffect, useState } from 'react'

export function WelcomeBanner({ name }: { name?: string }) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    let timeGreeting = 'Good evening'
    if (hour < 12) timeGreeting = 'Good morning'
    else if (hour < 18) timeGreeting = 'Good afternoon'

    const displayName = name || 'Friend'
    
    const greetings = [
      `${timeGreeting}, ${displayName}!`,
      `Welcome back, ${displayName}!`,
      `Great to see you, ${displayName}!`,
      `Hello there, ${displayName}!`
    ]
    
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)])
  }, [name])

  if (!greeting) return null

  return (
    <div className="px-4 pt-6 pb-2 anim-slide-in-left">
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        {greeting}
      </h2>
    </div>
  )
}
