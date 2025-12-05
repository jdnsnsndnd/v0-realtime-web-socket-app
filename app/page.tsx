"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  id: string
  text: string
  timestamp: string
  type: "sent" | "received" | "system"
  clientId?: string
}

export default function WebSocketDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [clientId, setClientId] = useState<string>("")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const addMessage = (text: string, type: Message["type"], clientId?: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      timestamp: new Date().toLocaleTimeString("ar-EG"),
      type,
      clientId,
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus("connecting")
    addMessage("جاري الاتصال بالخادم...", "system")

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/ws`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setIsConnected(true)
        setConnectionStatus("connected")
        addMessage("تم الاتصال بنجاح! 🎉", "system")
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle different message types
          if (data.type === "system") {
            addMessage(data.message, "system")
            if (data.clientId) {
              setClientId(data.clientId)
            }
          } else if (data.type === "echo") {
            addMessage(data.message, "received")
          } else if (data.type === "message") {
            addMessage(`من ${data.clientId}: ${data.text}`, "received", data.clientId)
          } else {
            addMessage(event.data, "received")
          }
        } catch {
          // If not JSON, display as plain text
          addMessage(event.data, "received")
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        addMessage("حدث خطأ في الاتصال ❌", "system")
      }

      ws.onclose = () => {
        setIsConnected(false)
        setConnectionStatus("disconnected")
        addMessage("تم قطع الاتصال 📡", "system")

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          addMessage("محاولة إعادة الاتصال...", "system")
          connectWebSocket()
        }, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Failed to create WebSocket:", error)
      addMessage("فشل إنشاء الاتصال ❌", "system")
      setConnectionStatus("disconnected")
    }
  }

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const messageData = {
      type: "message",
      text: inputMessage,
      timestamp: new Date().toISOString(),
    }

    wsRef.current.send(JSON.stringify(messageData))
    addMessage(inputMessage, "sent")
    setInputMessage("")
  }

  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">تجربة WebSocket حقيقي</CardTitle>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-sm">
              {connectionStatus === "connected" && "🟢 متصل"}
              {connectionStatus === "connecting" && "🟡 جاري الاتصال"}
              {connectionStatus === "disconnected" && "🔴 غير متصل"}
            </Badge>
          </div>
          <CardDescription className="text-base">
            WebSocket حقيقي باستخدام Node.js + مكتبة ws - جاهز للنشر على Railway
            {clientId && <span className="block mt-1 text-xs font-mono">معرفك: {clientId}</span>}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Connection Controls */}
          <div className="flex gap-2">
            <Button
              onClick={connectWebSocket}
              disabled={isConnected}
              className="flex-1"
              variant={isConnected ? "secondary" : "default"}
            >
              {isConnected ? "✓ متصل" : "الاتصال"}
            </Button>
            <Button onClick={disconnectWebSocket} disabled={!isConnected} variant="destructive" className="flex-1">
              قطع الاتصال
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="h-[400px] w-full rounded-lg border bg-muted/30 p-4">
            <div className="space-y-3" dir="rtl">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-lg">لا توجد رسائل بعد</p>
                  <p className="text-sm mt-2">ابدأ بالاتصال ثم أرسل رسالة!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${
                      msg.type === "sent" ? "items-start" : msg.type === "received" ? "items-end" : "items-center"
                    }`}
                  >
                    <div
                      className={`rounded-xl px-4 py-2 max-w-[80%] ${
                        msg.type === "sent"
                          ? "bg-primary text-primary-foreground"
                          : msg.type === "received"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground text-sm"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground px-2">{msg.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex gap-2" dir="rtl">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              disabled={!isConnected}
              className="flex-1 text-right"
            />
            <Button onClick={sendMessage} disabled={!isConnected || !inputMessage.trim()}>
              إرسال
            </Button>
          </div>

          {/* Info Section */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm text-right" dir="rtl">
                <p className="font-semibold">✅ ميزات WebSocket الحقيقي:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mr-4">
                  <li>WebSocket Handshake حقيقي (Status 101)</li>
                  <li>Node.js Runtime مع مكتبة ws</li>
                  <li>إرسال واستقبال ثنائي الاتجاه فوري</li>
                  <li>Broadcast للرسائل بين المستخدمين</li>
                  <li>إعادة اتصال تلقائي</li>
                  <li>جاهز للنشر على Railway</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
