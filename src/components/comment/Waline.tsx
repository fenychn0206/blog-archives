import { useEffect, useRef } from 'react'
import { init } from '@waline/client'
import '@waline/client/style'

export function Waline({ serverURL }: { serverURL: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const walineInst = init({
      el: ref.current,
      serverURL,
      dark: "[data-theme='dark']",
      login: 'force',
      lang: 'zh-CN',
      imageUploader: false,
      search: true,
      locale: {
        placeholder: '🥱 无聊了？来评论吧……（评论修复中，暂停使用）',
        admin: '本龙🐲',
        submit: '发射～',
        more: '继续看',
        refresh: '刷刷新新',
        reactionTitle: "求好评！",
        sofa: '来抢首评啊！！'
      },
      emoji: ['//unpkg.com/@waline/emojis@1.1.0/bilibili'],
    })

    return () => {
      if (ref.current) {
        walineInst?.destroy()
      }
    }
  }, [serverURL])

  return <div ref={ref}></div>
}
