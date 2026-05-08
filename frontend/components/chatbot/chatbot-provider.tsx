'use client'

import dynamic from 'next/dynamic'

const FloatingChatbot = dynamic(() => import('./floating-chatbot'), {
  ssr: false,
})

export default function ChatbotProvider() {
  return <FloatingChatbot />
}
