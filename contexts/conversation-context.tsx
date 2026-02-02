"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ConversationContextType {
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Omit<Message, 'id' | 'created_at'>) => void
  clearMessages: () => void
  createNewConversation: () => void
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const addMessage = useCallback((message: Omit<Message, 'id' | 'created_at'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const createNewConversation = useCallback(() => {
    setActiveConversationId(null)
    clearMessages()
  }, [clearMessages])

  return (
    <ConversationContext.Provider
      value={{
        activeConversationId,
        setActiveConversationId,
        messages,
        setMessages,
        addMessage,
        clearMessages,
        createNewConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}
