'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronRight } from 'lucide-react'

const TABLES = ['profiles', 'walks', 'walk_participants', 'messages', 'reviews'] as const

export default function DevDbPage() {
  const [table, setTable] = useState<string>('profiles')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/dev/db?table=${table}&limit=50`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setRows([]) }
        else setRows(d.rows || [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [table])

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dev" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">База данных</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {TABLES.map(t => (
          <button
            key={t}
            onClick={() => setTable(t)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
              table === t ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по таблице..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Загрузка...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Таблица пуста</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows
                .filter(row => !search || JSON.stringify(row).toLowerCase().includes(search.toLowerCase()))
                .map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {columns.map(col => (
                      <td key={col} className="px-3 py-2 max-w-[200px] truncate" title={String(row[col] ?? '')}>
                        {formatValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatValue(val: unknown): string {
  if (val === null) return <span className="text-gray-400 italic">NULL</span> as any
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 50)
  return String(val)
}
