'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const COLORES = {
  Natación: '#3b82f6',
  Ciclismo: '#f59e0b',
  Running: '#ef4444',
  Otro: '#94a3b8',
}

function getWeekStart(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

function formatSemana(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ProgresoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [disciplineData, setDisciplineData] = useState<any[]>([])
  const [totalKm, setTotalKm] = useState(0)
  const [totalHoras, setTotalHoras] = useState(0)
  const [totalSesiones, setTotalSesiones] = useState(0)

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
        .order('fecha', { ascending: true })

      const activities = acts || []
      procesarDatos(activities)
      setLoading(false)
    }
    load()
  }, [router])

  const procesarDatos = (activities: any[]) => {
    if (activities.length === 0) return

    // Totales generales
    const km = activities.reduce((s, a) => s + (Number(a.distancia_km) || 0), 0)
    const min = activities.reduce((s, a) => s + (Number(a.duracion_minutos) || 0), 0)
    setTotalKm(parseFloat(km.toFixed(1)))
    setTotalHoras(Math.round(min / 60))
    setTotalSesiones(activities.length)

    // Agrupar por semana (últimas 8 semanas)
    const semanas: Record<string, any> = {}
    activities.forEach((act) => {
      const semana = getWeekStart(act.fecha)
      if (!semanas[semana]) {
        semanas[semana] = {
          semana,
          Natación: 0,
          Ciclismo: 0,
          Running: 0,
          Otro: 0,
          total: 0,
        }
      }
      const tipo = act.tipo || 'Otro'
      const dist = Number(act.distancia_km) || 0
      if (semanas[semana][tipo] !== undefined) {
        semanas[semana][tipo] += dist
      } else {
        semanas[semana]['Otro'] += dist
      }
      semanas[semana].total += dist
    })

    const semanasArray = Object.values(semanas)
      .sort((a: any, b: any) => a.semana.localeCompare(b.semana))
      .slice(-8)
      .map((s: any) => ({
        ...s,
        label: formatSemana(s.semana),
        Natación: parseFloat(s.Natación.toFixed(1)),
        Ciclismo: parseFloat(s.Ciclismo.toFixed(1)),
        Running: parseFloat(s.Running.toFixed(1)),
        Otro: parseFloat(s.Otro.toFixed(1)),
      }))

    setWeeklyData(semanasArray)

    // Datos para pie chart (totales por disciplina)
    const disc: Record<string, number> = { Natación: 0, Ciclismo: 0, Running: 0, Otro: 0 }
    activities.forEach((act) => {
      const tipo = act.tipo || 'Otro'
      disc[tipo] = (disc[tipo] || 0) + (Number(act.distancia_km) || 0)
    })

    setDisciplineData(
      Object.entries(disc)
        .filter(([_, v]) => v > 0)
        .map(([name, value]) => ({
          name,
          value: parseFloat(value.toFixed(1)),
          color: COLORES[name as keyof typeof COLORES],
        }))
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Cargando progreso...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Progreso</h1>
            <p className="text-slate-400 mt-1">Análisis de tu entrenamiento acumulado</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
            ← Dashboard
          </Link>
        </div>

        {/* Cards resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl text-center border border-slate-700">
            <p className="text-4xl font-bold text-blue-400">{totalKm}</p>
            <p className="text-slate-400 mt-1">Kilómetros totales</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl text-center border border-slate-700">
            <p className="text-4xl font-bold text-amber-400">{totalHoras}</p>
            <p className="text-slate-400 mt-1">Horas totales</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl text-center border border-slate-700">
            <p className="text-4xl font-bold text-green-400">{totalSesiones}</p>
            <p className="text-slate-400 mt-1">Sesiones completadas</p>
          </div>
        </div>

        {weeklyData.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-xl">No hay suficientes datos aún.</p>
            <p>Sincroniza con Strava o agrega entrenamientos manuales.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Gráfico 1: Km por semana (barras apiladas) */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Kilómetros por Semana</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="Natación" stackId="a" fill={COLORES.Natación} />
                    <Bar dataKey="Ciclismo" stackId="a" fill={COLORES.Ciclismo} />
                    <Bar dataKey="Running" stackId="a" fill={COLORES.Running} />
                    <Bar dataKey="Otro" stackId="a" fill={COLORES.Otro} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Distribución por disciplina (pie) */}
            {disciplineData.length > 0 && (
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h2 className="text-xl font-bold mb-4">Distribución por Disciplina</h2>
                <div className="h-80 flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disciplineData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {disciplineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico 3: Tendencia de volumen total (línea) */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Tendencia de Volumen Total (km)</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}