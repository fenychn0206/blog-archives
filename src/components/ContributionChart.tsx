import { useState, useEffect } from 'react'
import type { CollectionEntry } from 'astro:content'

interface ContributionData {
  date: string
  count: number
  level: number
}

interface TooltipData {
  date: string
  count: number
  x: number
  y: number
}

interface ContributionChartProps {
  posts: CollectionEntry<'blog'>[]
  className?: string
}

export default function ContributionChart({ posts, className = '' }: ContributionChartProps) {
  const [data, setData] = useState<ContributionData[]>([])
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  
  useEffect(() => {
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    const contributionMap = new Map<string, number>()
    
    posts.forEach(post => {
      const postDate = new Date(post.data.date)
      if (postDate >= oneYearAgo && postDate <= today) {
        const dateStr = postDate.toISOString().split('T')[0]
        const charCount = post.body?.length || 0
        contributionMap.set(dateStr, (contributionMap.get(dateStr) || 0) + charCount)
      }
    })
    
    const contributions: ContributionData[] = []
    const currentDate = new Date(oneYearAgo)
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const count = contributionMap.get(dateStr) || 0
      
      let level = 0
      if (count > 0) {
        if (count < 500) level = 1
        else if (count < 1500) level = 2
        else if (count < 3000) level = 3
        else level = 4
      }
      
      contributions.push({
        date: dateStr,
        count,
        level
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    setData(contributions)
  }, [posts])

  const weeks: (ContributionData | null)[][] = []
  let currentWeek: (ContributionData | null)[] = []
  
  data.forEach((day, index) => {
    const dayOfWeek = new Date(day.date).getDay()
    
    if (index === 0) {
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push(null)
      }
    }
    
    currentWeek.push(day)
    
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100 dark:bg-gray-800'
      case 1: return 'bg-green-200 dark:bg-green-900'
      case 2: return 'bg-green-300 dark:bg-green-700'
      case 3: return 'bg-green-400 dark:bg-green-600'
      case 4: return 'bg-green-500 dark:bg-green-500'
      default: return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleMouseEnter = (day: ContributionData, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      date: day.date,
      count: day.count,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  return (
    <div className={`relative p-4 ${className}`}>
      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm transition-all ${
                  day 
                    ? `cursor-pointer hover:scale-110 ${getColorClass(day.level)}` 
                    : 'bg-transparent'
                }`}
                onMouseEnter={day && day.count > 0 ? (e) => handleMouseEnter(day, e) : undefined}
                onMouseLeave={day && day.count > 0 ? handleMouseLeave : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
        <span>过去一年（左右滑动查看全部）</span>
        <div className="flex items-center gap-2">
          <span>字符数：少</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getColorClass(level)}`}
              />
            ))}
          </div>
          <span>多</span>
        </div>
      </div>
      
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-xl border border-gray-700 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: '#1f2937',
            color: '#ffffff'
          }}
        >
          <div className="font-medium">{formatDate(tooltip.date)}</div>
          <div className="text-gray-200">
            {tooltip.count > 0 
              ? `${tooltip.count.toLocaleString()} 字符` 
              : '无发布'}
          </div>
          <div
            className="absolute left-1/2 top-full transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1f2937'
            }}
          />
        </div>
      )}
    </div>
  )
}