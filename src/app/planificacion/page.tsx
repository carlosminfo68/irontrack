'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const TIPOS = ['Natación', 'Ciclismo', 'Running', 'Otro']

const COLORES: Record<string, string> = {
  Natación: 'border-blue-500 bg-blue-500/10 text-blue-400',
  Ciclismo: 'border-amber-500 bg-amber-500/10 text-amber-400',
  Running: 'border-red-500 bg-red-500/10 text-red-400',
  Otro: 'border-slate-500 bg-slate-500/10 text-slate-400',
}

const ICONOS: Record<string, string> = {
  Natación: '🏊‍♂️',
  Ciclismo: '🚴‍♂️',
  Running: '🏃‍♂️',
  Otro: '🏋️',
}

const ESTADOS: Record<string, { label: string; color: string }> = {
  planificado: { label: '📋 Planificado', color: 'text-slate-400' },
  completado: { label: '✅ Completado', color: 'text-green-400' },
  omitido: { label: '⏭️ Omitido', color: 'text-red-400' },
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatDia(d: Date) {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatHora(hora: string | null) {
  if (!hora) return ''
  return hora.slice(0, 5)
}

export default function PlanificacionPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [planes, setPlanes] = useState<any[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)

  // Estado para edición
  const [editandoPlan, setEditandoPlan] = useState<any>(null)

  const hoy = new Date()
  const lunesSemana = getMonday(addDays(hoy, semanaOffset * 7))
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(lunesSemana, i))

  const [form, setForm] = useState({
    tipo: 'Running',
    titulo: '',
    distancia_km_plan: '',
    duracion_minutos_plan: '',
    fecha: formatDate(hoy),
    hora: '06:00',
    notas: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await cargarPlanes(user.id)
      setLoading(false)
    }
    load()
  }, [router, semanaOffset])

  const cargarPlanes = async (uid: string) => {
    const inicio = formatDate(lunesSemana)
    const fin = formatDate(addDays(lunesSemana, 6))

    const { data } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', uid)
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    setPlanes(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const { error } = await supabase.rpc('add_training_plan', {
      p_user_id: user.id,
      p_tipo: form.tipo,
      p_titulo: form.titulo || 'Entrenamiento planificado',
      p_distancia_km_plan: form.distancia_km_plan ? parseFloat(form.distancia_km_plan) : 0,
      p_duracion_minutos_plan: form.duracion_minutos_plan ? parseInt(form.duracion_minutos_plan) : 0,
      p_fecha: form.fecha,
      p_hora: form.hora || null,
      p_semana_del: formatDate(lunesSemana),
      p_notas: form.notas,
    })

    if (error) {
      alert('Error guardando: ' + error.message)
      return
    }

    setMostrarForm(false)
    resetForm()
    await cargarPlanes(user.id)
  }

  const resetForm = () => {
    setForm({
      tipo: 'Running',
      titulo: '',
      distancia_km_plan: '',
      duracion_minutos_plan: '',
      fecha: formatDate(hoy),
      hora: '06:00',
      notas: '',
    })
  }

  // ABRIR EDICIÓN
  const abrirEdicion = (plan: any) => {
    setEditandoPlan(plan)
    setForm({
      tipo: plan.tipo,
      titulo: plan.titulo || '',
      distancia_km_plan: plan.distancia_km_plan ? String(plan.distancia_km_plan) : '',
      duracion_minutos_plan: plan.duracion_minutos_plan ? String(plan.duracion_minutos_plan) : '',
      fecha: plan.fecha,
      hora: plan.hora ? plan.hora.slice(0, 5) : '06:00',
      notas: plan.notas || '',
    })
    setMostrarForm(false)
  }

  // GUARDAR EDICIÓN
  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editandoPlan) return

    const { error } = await supabase
      .from('training_plans')
      .update({
        tipo: form.tipo,
        titulo: form.titulo || 'Entrenamiento planificado',
        distancia_km_plan: form.distancia_km_plan ? parseFloat(form.distancia_km_plan) : 0,
        duracion_minutos_plan: form.duracion_minutos_plan ? parseInt(form.duracion_minutos_plan) : 0,
        fecha: form.fecha,
        hora: form.hora || null,
        notas: form.notas,
      })
      .eq('id', editandoPlan.id)

    if (error) {
      alert('Error actualizando: ' + error.message)
      return
    }

    setEditandoPlan(null)
    resetForm()
    await cargarPlanes(user.id)
  }

  const cancelarEdicion = () => {
    setEditandoPlan(null)
    resetForm()
  }

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('training_plans')
      .update({ estado: nuevoEstado })
      .eq('id', id)

    if (!error && user) await cargarPlanes(user.id)
  }

  const borrarPlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan?')) return
    const { error } = await supabase.from('training_plans').delete().eq('id', id)
    if (!error && user) await cargarPlanes(user.id)
  }

  const planesPorDia = (fecha: string) => {
    return planes.filter((p) => p.fecha === fecha)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Cargando planificación...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Planificación Semanal</h1>
            <p className="text-slate-400 mt-1">
              Semana del {formatDia(lunesSemana)} al {formatDia(addDays(lunesSemana, 6))}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
              ← Dashboard
            </Link>
            <button
              onClick={() => {
                setMostrarForm(!mostrarForm)
                setEditandoPlan(null)
                resetForm()
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              {mostrarForm ? '✕ Cerrar' : '+ Planificar Entreno'}
            </button>
          </div>
        </div>

        {/* Navegación de semanas */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setSemanaOffset((s) => s - 1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            ← Semana anterior
          </button>
          <button
            onClick={() => setSemanaOffset(0)}
            className={`px-4 py-2 rounded-lg border transition ${
              semanaOffset === 0
                ? 'bg-blue-600 border-blue-500'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setSemanaOffset((s) => s + 1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            Semana siguiente →
          </button>
        </div>

        {/* FORMULARIO NUEVO */}
        {mostrarForm && !editandoPlan && (
          <div className="mb-8 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Nuevo Plan de Entrenamiento</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{ICONOS[t]} {t}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Fondo largo"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Distancia (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.distancia_km_plan}
                  onChange={(e) => setForm({ ...form, distancia_km_plan: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duración (min)</label>
                <input
                  type="number"
                  min="0"
                  value={form.duracion_minutos_plan}
                  onChange={(e) => setForm({ ...form, duracion_minutos_plan: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-400 mb-1">Día</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Notas</label>
                <input
                  type="text"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Ej: Zona 2, sin prisa"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                >
                  💾 Guardar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORMULARIO EDICIÓN */}
        {editandoPlan && (
          <div className="mb-8 p-6 bg-purple-900/30 rounded-xl border border-purple-500/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-300">✏️ Editar Entrenamiento</h2>
              <button
                onClick={cancelarEdicion}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
              >
                ✕ Cancelar
              </button>
            </div>
            <form onSubmit={guardarEdicion} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{ICONOS[t]} {t}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Distancia (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.distancia_km_plan}
                  onChange={(e) => setForm({ ...form, distancia_km_plan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duración (min)</label>
                <input
                  type="number"
                  min="0"
                  value={form.duracion_minutos_plan}
                  onChange={(e) => setForm({ ...form, duracion_minutos_plan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-400 mb-1">Día</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Notas</label>
                <input
                  type="text"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calendario semanal */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {diasSemana.map((dia, idx) => {
            const fechaStr = formatDate(dia)
            const planesDia = planesPorDia(fechaStr)
            const esHoy = formatDate(hoy) === fechaStr

            return (
              <div
                key={idx}
                className={`min-h-[220px] p-3 rounded-xl border ${
                  esHoy ? 'border-blue-500 bg-slate-800/80' : 'border-slate-700 bg-slate-800/40'
                }`}
              >
                <div className="text-center mb-3 pb-2 border-b border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-semibold">{DIAS[idx]}</p>
                  <p className={`text-lg font-bold ${esHoy ? 'text-blue-400' : 'text-white'}`}>
                    {dia.getDate()}
                  </p>
                </div>

                <div className="space-y-2">
                  {planesDia.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-4">Sin plan</p>
                  ) : (
                    planesDia.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => abrirEdicion(plan)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer hover:brightness-110 transition ${COLORES[plan.tipo] || COLORES.Otro}`}
                        title="Clic para editar"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold">
                            {plan.hora && <span className="text-white mr-1">{formatHora(plan.hora)}</span>}
                            {ICONOS[plan.tipo]} {plan.titulo}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              borrarPlan(plan.id)
                            }}
                            className="text-slate-500 hover:text-red-400"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                        {plan.distancia_km_plan > 0 && <p>{plan.distancia_km_plan} km</p>}
                        {plan.duracion_minutos_plan > 0 && <p>{plan.duracion_minutos_plan} min</p>}
                        {plan.notas && <p className="italic text-slate-500 mt-1">{plan.notas}</p>}
                        
                        <div className="mt-2 pt-1 border-t border-current/20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const estados = ['planificado', 'completado', 'omitido']
                              const idxActual = estados.indexOf(plan.estado)
                              const siguiente = estados[(idxActual + 1) % 3]
                              cambiarEstado(plan.id, siguiente)
                            }}
                            className={`text-xs font-medium hover:underline ${ESTADOS[plan.estado].color}`}
                          >
                            {ESTADOS[plan.estado].label}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumen semanal */}
        <div className="mt-8 p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Resumen de la semana</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TIPOS.map((tipo) => {
              const planesTipo = planes.filter((p) => p.tipo === tipo)
              const km = planesTipo.reduce((s, p) => s + (Number(p.distancia_km_plan) || 0), 0).toFixed(1)
              const min = planesTipo.reduce((s, p) => s + (Number(p.duracion_minutos_plan) || 0), 0)
              const completados = planesTipo.filter((p) => p.estado === 'completado').length
              const total = planesTipo.length

              return (
                <div key={tipo} className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl mb-1">{ICONOS[tipo]}</p>
                  <p className={`font-bold ${COLORES[tipo].split(' ')[2]}`}>{tipo}</p>
                  <p className="text-lg font-bold">{km} km</p>
                  <p className="text-sm text-slate-400">{min} min planificados</p>
                  <p className="text-xs mt-1 text-slate-500">{completados}/{total} completados</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}