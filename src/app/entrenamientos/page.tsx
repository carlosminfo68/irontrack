'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TIPOS = ['Todos', 'Natación', 'Ciclismo', 'Running', 'Otro']

const ICONOS: Record<string, string> = {
  Natación: '🏊‍♂️',
  Ciclismo: '🚴‍♂️',
  Running: '🏃‍♂️',
  Otro: '🏋️',
}

const COLORES: Record<string, string> = {
  Natación: 'text-blue-400',
  Ciclismo: 'text-amber-400',
  Running: 'text-red-400',
  Otro: 'text-slate-400',
}

export default function EntrenamientosPage() {
  const [user, setUser] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false })

      const list = acts || []
      setActivities(list)
      setFiltered(list)
      setLoading(false)
    }

    load()
  }, [router])

  // Aplicar filtros
  useEffect(() => {
    let result = [...activities]

    if (filtroTipo !== 'Todos') {
      result = result.filter((a) => a.tipo === filtroTipo)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      result = result.filter((a) =>
        (a.titulo || '').toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [filtroTipo, busqueda, activities])

  const formatDate = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Totales
  const totalKm = activities
    .reduce((sum, a) => sum + (Number(a.distancia_km) || 0), 0)
    .toFixed(1)

  const totalHoras = Math.round(
    activities.reduce((sum, a) => sum + (Number(a.duracion_minutos) || 0), 0) / 60
  )

  const downloadCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Titulo', 'Distancia_km', 'Duracion_min', 'Velocidad_media_kmh', 'Elevacion_m', 'FC_media', 'Notas']
    const rows = activities.map((a) => [
      a.fecha,
      a.tipo,
      `"${(a.titulo || '').replace(/"/g, '""')}"`,
      a.distancia_km || 0,
      a.duracion_minutos || 0,
      a.velocidad_media_kmh || '',
      a.elevacion_m || 0,
      a.fc_media || '',
      `"${(a.notas || '').replace(/"/g, '""')}"`,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('
')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `entrenamientos_irontrack_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Cargando entrenamientos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Entrenamientos</h1>
            <p className="text-slate-400 mt-1">
              {activities.length} actividades · {totalKm} km · {totalHoras} h totales
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              ← Dashboard
            </Link>
            <Link
              href="/entrenamientos/nuevo"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              + Nuevo
            </Link>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
            >
              📥 CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {TIPOS.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  filtroTipo === tipo
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {ICONOS[tipo] || '📋'} {tipo}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar por título..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full md:w-64"
          />
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-xl mb-2">No se encontraron entrenamientos</p>
            <p>Prueba con otro filtro o sincroniza con Strava</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((act) => (
              <div
                key={act.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-slate-800 rounded-xl hover:bg-slate-750 transition border border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{ICONOS[act.tipo] || '🏋️'}</span>
                  <div>
                    <p className="font-semibold text-lg">{act.titulo || 'Sin título'}</p>
                    <p className="text-sm text-slate-400">
                      {formatDate(act.fecha)} ·{' '}
                      <span className={COLORES[act.tipo] || 'text-slate-400'}>
                        {act.tipo}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 mt-3 md:mt-0 text-right">
                  {Number(act.distancia_km) > 0 && (
                    <div>
                      <p className="text-xl font-bold">{act.distancia_km} km</p>
                      <p className="text-xs text-slate-500">Distancia</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xl font-bold">{act.duracion_minutos} min</p>
                    <p className="text-xs text-slate-500">Tiempo</p>
                  </div>
                  {act.velocidad_media_kmh && (
                    <div>
                      <p className="text-xl font-bold">{act.velocidad_media_kmh} km/h</p>
                      <p className="text-xs text-slate-500">Vel. media</p>
                    </div>
                  )}
                  {act.elevacion_m > 0 && (
                    <div>
                      <p className="text-xl font-bold">{act.elevacion_m} m</p>
                      <p className="text-xs text-slate-500">Desnivel</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}