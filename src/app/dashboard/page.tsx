'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])
  const [stravaConnected, setStravaConnected] = useState(false)
  const [stats, setStats] = useState({
    natacion: 0,
    ciclismo: 0,
    running: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Verificar conexión Strava
      try {
        const res = await fetch(`/api/strava/connection?user_id=${user.id}`)
        const data = await res.json()
        setStravaConnected(data.connected)
      } catch {
        setStravaConnected(false)
      }

      // Cargar actividades de la tabla 'activities' (datos reales de Strava o manuales)
      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false })
        .limit(10)

      const allActivities = acts || []
      setActivities(allActivities)

      // Calcular km de esta semana (desde el lunes)
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
      startOfWeek.setHours(0, 0, 0, 0)

      const weeklyStats = { natacion: 0, ciclismo: 0, running: 0 }

      allActivities.forEach((act: any) => {
        const actDate = new Date(act.fecha)
        if (actDate >= startOfWeek) {
          if (act.tipo === 'Natación') weeklyStats.natacion += Number(act.distancia_km) || 0
          else if (act.tipo === 'Ciclismo') weeklyStats.ciclismo += Number(act.distancia_km) || 0
          else if (act.tipo === 'Running') weeklyStats.running += Number(act.distancia_km) || 0
        }
      })

      setStats({
        natacion: parseFloat(weeklyStats.natacion.toFixed(1)),
        ciclismo: parseFloat(weeklyStats.ciclismo.toFixed(1)),
        running: parseFloat(weeklyStats.running.toFixed(1)),
      })

      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSyncStrava = async () => {
    if (!user) return
    setLoading(true)
    const res = await fetch(`/api/strava/sync?user_id=${user.id}`)
    const data = await res.json()
    setLoading(false)

    if (data.error) {
      alert('Error: ' + data.error)
    } else {
      alert(data.message || 'Sincronización completada')
      window.location.reload()
    }
  }

  const formatDate = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getIcon = (tipo: string) => {
    if (tipo === 'Natación') return '🏊‍♂️'
    if (tipo === 'Ciclismo') return '🚴‍♂️'
    if (tipo === 'Running') return '🏃‍♂️'
    return '🏋️'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">

        {/* Banner de Strava conectado */}
        {typeof window !== 'undefined' && window.location.search.includes('strava=connected') && (
          <div className="mb-4 p-4 bg-green-600/20 border border-green-500 rounded-lg text-green-400">
            ¡Strava conectado exitosamente!
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-400">Bienvenido, {user?.user_metadata?.nombre || 'Atleta'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* CARDS CON KM REALES DE LA SEMANA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl">
            <div className="text-3xl mb-2">🏊‍♂️</div>
            <h3 className="text-lg font-semibold text-blue-400">Natación</h3>
            <p className="text-2xl font-bold">{stats.natacion} km</p>
            <p className="text-sm text-slate-400">Esta semana</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl">
            <div className="text-3xl mb-2">🚴‍♂️</div>
            <h3 className="text-lg font-semibold text-amber-400">Ciclismo</h3>
            <p className="text-2xl font-bold">{stats.ciclismo} km</p>
            <p className="text-sm text-slate-400">Esta semana</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl">
            <div className="text-3xl mb-2">🏃‍♂️</div>
            <h3 className="text-lg font-semibold text-red-400">Running</h3>
            <p className="text-2xl font-bold">{stats.running} km</p>
            <p className="text-sm text-slate-400">Esta semana</p>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Link
            href="/entrenamientos/nuevo"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            + Nuevo Entrenamiento
          </Link>
          <Link
            href="/entrenamientos"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition"
          >
            Ver Historial
          </Link>
          <Link
            href="/planificacion"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
          >
            📅 Planificación
          </Link>

          {!stravaConnected ? (
            <a
              href={`/api/strava/auth?user_id=${user.id}`}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition flex items-center gap-2"
            >
              🏃 Conectar Strava
            </a>
          ) : (
            <>
              <button
                onClick={handleSyncStrava}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                🔄 Sincronizar Strava
              </button>
              <span className="px-4 py-3 bg-orange-600/20 text-orange-400 rounded-lg flex items-center gap-2">
                ✅ Strava Conectado
                <Link
  href="/progreso"
  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition"
>
  📊 Progreso
</Link>
              </span>
            </>
          )}
        </div>

        {/* ENTRENAMIENTOS RECIENTES */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Entrenamientos Recientes</h2>
          {activities.length === 0 ? (
            <p className="text-slate-400">No hay entrenamientos registrados aún.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getIcon(act.tipo)}</span>
                    <div>
                      <p className="font-semibold">{act.titulo || 'Sin título'}</p>
                      <p className="text-sm text-slate-400">{formatDate(act.fecha)} · {act.tipo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{act.distancia_km} km</p>
                    <p className="text-sm text-slate-400">{act.duracion_minutos} min · {act.velocidad_media_kmh} km/h</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}