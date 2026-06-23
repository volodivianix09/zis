'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Copy, Check } from 'lucide-react'

const ENDPOINTS = [
  { method: 'GET', path: '/api/walks/nearby?lat=55.7558&lng=37.6173&radius=3', desc: 'Прогулки рядом' },
  { method: 'POST', path: '/api/liveness/challenge', desc: 'Создать challenge', body: '{}' },
  { method: 'POST', path: '/api/liveness/verify', desc: 'Проверить liveness', body: '{"challenge_id":"test","score":0.85,"device_fingerprint":"test","timing_ms":3000}' },
  { method: 'POST', path: '/api/auth/telegram', desc: 'Авторизация (требует initData)', body: '{"telegram_user":{"id":1,"first_name":"Test"},"init_data":"test"}' },
]

export default function DevApiPage() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const sendRequest = async () => {
    setLoading(true)
    try {
      const opts: RequestInit = { method }
      if (method !== 'GET' && body) {
        opts.headers = { 'Content-Type': 'application/json' }
        opts.body = body
      }
      const res = await fetch(url, opts)
      setStatus(res.status)
      const text = await res.text()
      try { setResponse(JSON.stringify(JSON.parse(text), null, 2)) }
      catch { setResponse(text) }
    } catch (e: any) {
      setStatus(0)
      setResponse(e.message)
    }
    setLoading(false)
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(response || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadEndpoint = (ep: typeof ENDPOINTS[0]) => {
    setUrl(ep.path)
    setMethod(ep.method as any)
    setBody(ep.body || '')
    setResponse(null)
    setStatus(null)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dev" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">API Console</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Быстрые endpoint-ы</h2>
        <div className="flex flex-wrap gap-2">
          {ENDPOINTS.map((ep, i) => (
            <button
              key={i}
              onClick={() => loadEndpoint(ep)}
              className="px-3 py-1.5 bg-gray-100 rounded text-xs hover:bg-gray-200 text-left"
              title={ep.path}
            >
              <span className={`font-mono font-bold ${ep.method === 'GET' ? 'text-green-600' : 'text-blue-600'}`}>
                {ep.method}
              </span>
              <span className="text-gray-600 ml-1">{ep.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-4">
        <div className="flex gap-2 mb-3">
          <select
            value={method}
            onChange={e => setMethod(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm font-mono font-bold"
          >
            <option value="GET" className="text-green-600">GET</option>
            <option value="POST" className="text-blue-600">POST</option>
            <option value="PUT" className="text-orange-600">PUT</option>
            <option value="DELETE" className="text-red-600">DELETE</option>
          </select>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="/api/..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
          />
          <button
            onClick={sendRequest}
            disabled={loading || !url}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1 hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Send className="w-4 h-4" />
            {loading ? '...' : 'Send'}
          </button>
        </div>

        {method !== 'GET' && (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-xs font-mono mb-3"
          />
        )}
      </div>

      {response !== null && (
        <div className="border rounded-lg">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b rounded-t-lg">
            <span className={`text-sm font-mono font-bold ${status && status < 300 ? 'text-green-600' : 'text-red-600'}`}>
              {status || 'ERROR'}
            </span>
            <button onClick={copyResponse} className="p-1 hover:bg-gray-200 rounded">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
          <pre className="p-4 text-sm font-mono overflow-x-auto max-h-96">{response}</pre>
        </div>
      )}
    </div>
  )
}
