import type { CollectionEntry } from 'astro:content'

export interface RSSFeedItem {
  title: string
  link: string
  pubDate: Date
  description?: string
  author?: string
  guid?: string
}

// Server-side RSS parsing using regex (works in Node.js environment)
export async function fetchRSSFeed(url: string): Promise<RSSFeedItem[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const text = await response.text()
    
    const parseRSSItems = (xmlString: string): RSSFeedItem[] => {
      const items: RSSFeedItem[] = []
      
      // Check if it's an Atom feed or RSS feed
      const isAtom = xmlString.includes('<feed') || xmlString.includes('<entry>')
      
      if (isAtom) {
        // Parse Atom feed entries
        const entryMatches = xmlString.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi)
        
        if (entryMatches) {
          entryMatches.forEach((entryXml) => {
            // Extract title (handle CDATA)
            const titleMatch = entryXml.match(/<title[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/is)
            const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim()
            
            // Extract link (Atom uses different format)
            const linkMatch = entryXml.match(/<link[^>]*href=["'](.*?)["'][^>]*>/is) || 
                             entryXml.match(/<link[^>]*>(.*?)<\/link>/is)
            const link = (linkMatch?.[1] || '').trim()
            
            // Extract published/updated date
            const pubDateMatch = entryXml.match(/<(?:published|updated)[^>]*>(.*?)<\/(?:published|updated)>/is)
            const pubDateText = (pubDateMatch?.[1] || '').trim()
            
            // Extract summary/content (handle CDATA)
            const descriptionMatch = entryXml.match(/<(?:summary|content)[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/(?:summary|content)>/is)
            const description = (descriptionMatch?.[1] || descriptionMatch?.[2] || '').trim()
            
            // Extract author
            const authorMatch = entryXml.match(/<author[^>]*>[\s\S]*?<name[^>]*>(.*?)<\/name>[\s\S]*?<\/author>/is) ||
                               entryXml.match(/<author[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/author>/is)
            const author = (authorMatch?.[1] || authorMatch?.[2] || '').trim()
            
            // Extract id (Atom uses id instead of guid)
            const guidMatch = entryXml.match(/<id[^>]*>(.*?)<\/id>/is)
            const guid = (guidMatch?.[1] || link).trim()
            
            if (title && link) {
              items.push({
                title: decodeHTMLEntities(title),
                link: link.replace(/&amp;/g, '&'),
                pubDate: pubDateText ? new Date(pubDateText) : new Date(),
                description: description ? decodeHTMLEntities(stripHTML(description)) : '',
                author: decodeHTMLEntities(author),
                guid: guid.replace(/&amp;/g, '&'),
              })
            }
          })
        }
      } else {
        // Parse RSS feed items
        const itemMatches = xmlString.match(/<item[^>]*>[\s\S]*?<\/item>/gi)
        
        if (itemMatches) {
          itemMatches.forEach((itemXml) => {
            // Extract title (handle CDATA)
            const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/is)
            const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim()
            
            // Extract link
            const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/is)
            const link = (linkMatch?.[1] || '').trim()
            
            // Extract pubDate
            const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/is)
            const pubDateText = (pubDateMatch?.[1] || '').trim()
            
            // Extract description (handle CDATA)
            const descriptionMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/description>/is)
            const description = (descriptionMatch?.[1] || descriptionMatch?.[2] || '').trim()
            
            // Extract author
            const authorMatch = itemXml.match(/<(?:author|dc:creator)[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/(?:author|dc:creator)>/is)
            const author = (authorMatch?.[1] || authorMatch?.[2] || '').trim()
            
            // Extract guid
            const guidMatch = itemXml.match(/<guid[^>]*>(.*?)<\/guid>/is)
            const guid = (guidMatch?.[1] || link).trim()
            
            if (title && link) {
              items.push({
                title: decodeHTMLEntities(title),
                link: link.replace(/&amp;/g, '&'),
                pubDate: pubDateText ? new Date(pubDateText) : new Date(),
                description: description ? decodeHTMLEntities(stripHTML(description)) : '',
                author: decodeHTMLEntities(author),
                guid: guid.replace(/&amp;/g, '&'),
              })
            }
          })
        }
      }
      
      return items
    }
    
    const feedItems = parseRSSItems(text)
    return feedItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error)
    return []
  }
}

// Helper function to decode HTML entities
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// Helper function to strip HTML tags
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export async function getFriendRSSFeeds(
  friends: CollectionEntry<'friends'>[]
): Promise<Map<string, RSSFeedItem[]>> {
  const feedsMap = new Map<string, RSSFeedItem[]>()
  
  const feedPromises = friends
    .filter(friend => friend.data.rss)
    .map(async (friend) => {
      try {
        const feedItems = await fetchRSSFeed(friend.data.rss!)
        feedsMap.set(friend.id, feedItems)
      } catch (error) {
        console.error(`Failed to fetch RSS for ${friend.data.name}:`, error)
        feedsMap.set(friend.id, [])
      }
    })
  
  await Promise.all(feedPromises)
  return feedsMap
}

export function getRecentFeedItems(
  feedsMap: Map<string, RSSFeedItem[]>,
  count: number = 10
): { friendId: string; item: RSSFeedItem }[] {
  const allItems: { friendId: string; item: RSSFeedItem }[] = []
  
  feedsMap.forEach((items, friendId) => {
    items.forEach(item => {
      allItems.push({ friendId, item })
    })
  })
  
  return allItems
    .sort((a, b) => b.item.pubDate.getTime() - a.item.pubDate.getTime())
    .slice(0, count)
}