'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TIPOS = [
  { value: 'Natación', icon: '🏊‍♂️', color: 'text-blue-400' },
  { value: 'Ciclismo', icon: '🚴‍♂️', color: 'text-amber-400' },
  { value: 'Running', icon: '🏃‍♂️', color: 'text-red-400' },
  { value: 'Otro', icon: '🏋️', color: 'text-slate-400' },
]

export default function NuevoEntrenamientoPage() {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    tipo: 'Running',
    titulo: '',
    distancia_km: '',
    duracion_minutos: '',
    fecha: new Date().toISOString().slice(0, 16), // formato datetime-local
    elevacion_m: '',
    velocidad_media_kmh: '',
    fc_media: '',
    notas: '',
  })

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setMensaje('Error: No estás autenticado')
      setGuardando(false)
      return
    }

    const dataToInsert = {
      user_id: user.id,
      tipo: form.tipo,
      titulo: form.titulo || 'Entrenamiento manual',
      distancia_km: form.distancia_km ? parseFloat(form.distancia_km) : 0,
      duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : 0,
      fecha: new Date(form.fecha).toISOString(),
      elevacion_m: form.elevacion_m ? parseFloat(form.elevacion_m) : 0,
      velocidad_media_kmh: form.velocidad_media_kmh ? parseFloat(form.velocidad_media_kmh) : null,
      fc_media: form.fc_media ? parseInt(form.fc_media) : null,
            notas: form.notas || null,
    }

    const { error } = await supabase.from('activities').insert(dataToInsert)

    if (error) {
      console.error('Error guardando:', error)
      setMensaje('Error al guardar: ' + error.message)
      setGuardando(false)
      return
    }

    setMensaje('¡Entrenamiento guardado!')
    setTimeout(() => {
      router.push('/entrenamientos')
    }, 1000)
  }

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Nuevo Entrenamiento</h1>
          <Link
            href="/entrenamientos"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            ← Volver
          </Link>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.includes('Error')
              ? 'bg-red-600/20 border border-red-500 text-red-400'
              : 'bg-green-600/20 border border-green-500 text-green-400'
          }`}>
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 rounded-xl border border-slate-700/50">

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de actividad</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: t.value })}
                  className={`p-3 rounded-lg border transition text-center ${
                    form.tipo === t.value
                      ? 'border-blue-500 bg-blue-600/20'
                      : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <span className={`text-sm font-medium ${t.color}`}>{t.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: Entrenamiento largo domingo"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fecha y hora</label>
            <input
              type="datetime-local"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Distancia y Duración (lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Distancia (km)</label>
              <input
                type="number"
                name="distancia_km"
                value={form.distancia_km}
                onChange={handleChange}
                placeholder="Ej: 10.5"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duración (minutos)</label>
              <input
                type="number"
                name="duracion_minutos"
                value={form.duracion_minutos}
                onChange={handleChange}
                placeholder="Ej: 45"
                min="0"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Velocidad, Elevación, FC (lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vel. media (km/h)</label>
              <input
                type="number"
                name="velocidad_media_kmh"
                value={form.velocidad_media_kmh}
                onChange={handleChange}
                placeholder="Opcional"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Desnivel (m)</label>
              <input
                type="number"
                name="elevacion_m"
                value={form.elevacion_m}
                onChange={handleChange}
                placeholder="Opcional"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">FC media (ppm)</label>
              <input
                type="number"
                name="fc_media"
                value={form.fc_media}
                onChange={handleChange}
                placeholder="Opcional"
                min="0"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notas / Sensaciones</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Ej: Intervalos 5x1km. FC subió a 165 en subidas. Rodilla derecha molesta al final."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          {/* Botón guardar */}
          <button
            type="submit"
            disabled={guardando}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition ${
              guardando
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Entrenamiento'}
          </button>
        </form>
      </div>
    </div>
  )
}