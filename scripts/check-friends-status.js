#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

async function checkWithXXAPI(url) {
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

async function checkWithDirectRequest(url) {
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

export async function checkWebsiteStatus(url) {
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

function parseFrontmatter(content) {
  const lines = content.split('\n')
  if (lines[0] !== '---') return {}
  
  const endIndex = lines.findIndex((line, index) => index > 0 && line === '---')
  if (endIndex === -1) return {}
  
  const frontmatterLines = lines.slice(1, endIndex)
  const data = {}
  
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      
      // Remove quotes
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1)
      }
      
      // Parse numbers and booleans
      if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (!isNaN(value) && value !== '') value = Number(value)
      else if (value.includes('T') && value.includes('Z')) {
        try { value = new Date(value) } catch {}
      }
      
      data[key] = value
    }
  }
  
  return data
}

export async function getAllFriendsStatus() {
  const friendsDir = path.join(process.cwd(), 'src/content/friends')
  const files = await fs.readdir(friendsDir)
  const mdFiles = files.filter(file => file.endsWith('.md'))
  
  const friends = []
  for (const file of mdFiles) {
    const filePath = path.join(friendsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const data = parseFrontmatter(content)
    const id = path.basename(file, '.md')
    
    friends.push({
      id,
      name: data.name,
      website: data.website,
      status: data.status || 'active',
      lastChecked: data.lastChecked,
      failedCount: data.failedCount || 0,
      hidden: data.hidden || false,
    })
  }
  
  return friends
}

export async function updateFriendStatus(friendId, status, failedCount) {
  const friendPath = path.join(process.cwd(), 'src/content/friends', `${friendId}.md`)
  
  try {
    const content = await fs.readFile(friendPath, 'utf-8')
    const lines = content.split('\n')
    
    // 找到前置内容的开始和结束
    const frontmatterStart = lines.findIndex(line => line.trim() === '---')
    const frontmatterEnd = lines.findIndex((line, index) => index > frontmatterStart && line.trim() === '---')
    
    if (frontmatterStart === -1 || frontmatterEnd === -1) {
      throw new Error(`Invalid frontmatter in ${friendId}.md`)
    }
    
    // 提取前置内容行
    const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd)
    
    // 过滤掉已存在的状态字段
    const filteredLines = frontmatterLines.filter(line => {
      const trimmed = line.trim()
      return !trimmed.startsWith('status:') && 
             !trimmed.startsWith('lastChecked:') && 
             !trimmed.startsWith('failedCount:') &&
             !trimmed.startsWith('hidden:')
    })
    
    // 添加新的状态字段
    filteredLines.push(`status: '${status}'`)
    filteredLines.push(`lastChecked: '${new Date().toISOString()}'`)
    
    if (failedCount !== undefined) {
      filteredLines.push(`failedCount: ${failedCount}`)
    }
    
    const shouldHide = (failedCount || 0) >= 3
    if (shouldHide) {
      filteredLines.push(`hidden: true`)
    }
    
    // 重构文件内容：前置内容前的部分 + 新前置内容 + 前置内容后的部分
    const beforeFrontmatter = lines.slice(0, frontmatterStart + 1)  // 包含第一个 ---
    const afterFrontmatter = lines.slice(frontmatterEnd)            // 包含第二个 --- 及后续内容
    
    const newContent = [
      ...beforeFrontmatter,
      ...filteredLines,
      ...afterFrontmatter
    ].join('\n')
    
    await fs.writeFile(friendPath, newContent, 'utf-8')
    
    console.log(`Updated ${friendId}: status=${status}, failedCount=${failedCount}, hidden=${shouldHide}`)
  } catch (error) {
    console.error(`Failed to update friend ${friendId}:`, error)
    throw error
  }
}

export async function checkAllFriendsStatus() {
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

async function main() {
  console.log('🔍 Starting friends link status check...')
  console.log(`⏰ Check time: ${new Date().toLocaleString('zh-CN')}`)
  
  try {
    await checkAllFriendsStatus()
    console.log('✅ Friends link status check completed successfully')
  } catch (error) {
    console.error('❌ Friends link status check failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}