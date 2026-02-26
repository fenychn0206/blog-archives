import { useState } from 'react'

interface FriendPost {
  title: string
  link: string
  description: string
  pubDate: string
  friendName: string
  friendAvatar: string
  friendWebsite: string
}

interface FriendsRSSFeedProps {
  initialPosts: FriendPost[]
  className?: string
}

export default function FriendsRSSFeed({ initialPosts, className = '' }: FriendsRSSFeedProps) {
  const [posts] = useState<FriendPost[]>(initialPosts)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  if (posts.length === 0) {
    return (
      <div className={`${className}`}>
        <h2 className="text-2xl font-medium mb-4">友链鲤鱼池</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>暂无友链文章</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-medium mb-4">友链鲤鱼池</h2>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div
            key={`${post.link}-${index}`}
            className="hover:bg-secondary/50 rounded-xl border p-4 transition-colors duration-300 ease-in-out"
          >
            <a 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col gap-4 sm:flex-row group"
            >
              <div className="max-w-3xs sm:shrink-0">
                <img 
                  src={post.friendAvatar} 
                  alt={post.friendName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${post.friendName}`
                  }}
                />
              </div>
              
              <div className="grow">
                <h3 className="mb-1 text-lg font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="text-muted-foreground mb-2 text-sm line-clamp-2">
                    {post.description}
                  </p>
                )}
                
                <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-2 text-xs">
                  <span>{post.friendName}</span>
                  <span className="h-4 w-px bg-border"></span>
                  <time>{formatDate(post.pubDate)}</time>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}