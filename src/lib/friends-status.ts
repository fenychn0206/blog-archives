import { getCollection } from 'astro:content'
import fs from 'fs/promises'
import path from 'path'

export interface FriendStatus {
  id: string
  name: string
  website?: string
  status: 'active' | 'inactive'
  lastChecked?: Date
  failedCount: number
  hidden: boolean
}

async function checkWithXXAPI(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const apiUrl = `https://v2.xxapi.cn/api/status?url=${encodeURIComponent(url)}`
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FriendLinkChecker/1.0)',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    if (data.code === 200 && data.data) {
      const statusCode = parseInt(data.data)
      return statusCode >= 200 && statusCode < 400
    }
    return false
  } catch (error) {
    return false
  }
}

async function checkWithDirectRequest(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FriendLinkChecker/1.0)',
      },
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    return false
  }
}

export async function checkWebsiteStatus(url: string): Promise<boolean> {
  try {
    const xxapiResult = await checkWithXXAPI(url)
    if (xxapiResult) {
      return true
    }
    
    console.log(`XXAPI check failed for ${url}, falling back to direct request`)
    return await checkWithDirectRequest(url)
  } catch (error) {
    console.error(`Failed to check ${url}:`, error)
    return false
  }
}

export async function getAllFriendsStatus(): Promise<FriendStatus[]> {
  const friends = await getCollection('friends')
  return friends.map(friend => ({
    id: friend.id,
    name: friend.data.name,
    website: friend.data.website,
    status: friend.data.status || 'active',
    lastChecked: friend.data.lastChecked,
    failedCount: friend.data.failedCount || 0,
    hidden: friend.data.hidden || false,
  }))
}

export async function updateFriendStatus(
  friendId: string,
  status: 'active' | 'inactive',
  failedCount?: number
): Promise<void> {
  const friendPath = path.join(process.cwd(), 'src/content/friends', `${friendId}.md`)
  
  try {
    const content = await fs.readFile(friendPath, 'utf-8')
    const [frontmatter, ...bodyParts] = content.split('---')
    const body = bodyParts.join('---')
    
    const lines = frontmatter.split('\n').filter(line => line.trim())
    const updatedLines = lines.filter(line => 
      !line.includes('status:') && 
      !line.includes('lastChecked:') && 
      !line.includes('failedCount:') &&
      !line.includes('hidden:')
    )
    
    updatedLines.push(`status: '${status}'`)
    updatedLines.push(`lastChecked: ${new Date().toISOString()}`)
    
    if (failedCount !== undefined) {
      updatedLines.push(`failedCount: ${failedCount}`)
    }
    
    const shouldHide = (failedCount || 0) >= 3
    if (shouldHide) {
      updatedLines.push(`hidden: true`)
    }
    
    const newContent = `---\n${updatedLines.join('\n')}\n---${body}`
    await fs.writeFile(friendPath, newContent, 'utf-8')
    
    console.log(`Updated ${friendId}: status=${status}, failedCount=${failedCount}, hidden=${shouldHide}`)
  } catch (error) {
    console.error(`Failed to update friend ${friendId}:`, error)
    throw error
  }
}

export async function checkAllFriendsStatus(): Promise<void> {
  const friends = await getAllFriendsStatus()
  
  for (const friend of friends) {
    if (!friend.website) {
      console.log(`Skipping ${friend.name} - no website`)
      continue
    }
    
    console.log(`Checking ${friend.name} (${friend.website})...`)
    const isOnline = await checkWebsiteStatus(friend.website)
    
    if (isOnline) {
      if (friend.status === 'inactive') {
        await updateFriendStatus(friend.id, 'active', 0)
        console.log(`✅ ${friend.name} is back online`)
      } else {
        await updateFriendStatus(friend.id, 'active', 0)
        console.log(`✅ ${friend.name} is online`)
      }
    } else {
      const newFailedCount = (friend.failedCount || 0) + 1
      await updateFriendStatus(friend.id, 'inactive', newFailedCount)
      
      if (newFailedCount >= 3) {
        console.log(`❌ ${friend.name} is offline (${newFailedCount} failures) - HIDDEN`)
      } else {
        console.log(`❌ ${friend.name} is offline (${newFailedCount} failures)`)
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}