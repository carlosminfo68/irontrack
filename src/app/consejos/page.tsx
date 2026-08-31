'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Activity = {
  tipo: string;
  distancia_km: number;
  duracion_min: number;
  fecha: string;
};

type WeeklyStats = {
  swim_km: number;
  bike_km: number;
  run_km: number;
  total_km: number;
  total_min: number;
};

type Phase = 'reinicio' | 'base' | 'construccion' | 'pico';

type PhaseConfig = {
  label: string;
  emoji: string;
  swim: [number, number];
  bike: [number, number];
  run: [number, number];
  hours: [number, number];
  swimSessions: string;
  bikeSessions: string;
  runSessions: string;
  color: string;
  bg: string;
  border: string;
  text: string;
};

const PHASES: Record<Phase, PhaseConfig> = {
  reinicio: {
    label: 'Reinicio',
    emoji: '🟢',
    swim: [1, 3],
    bike: [30, 80],
    run: [8, 20],
    hours: [3, 5],
    swimSessions: '1-2 sesiones',
    bikeSessions: '1-2 salidas',
    runSessions: '3-4 sesiones suaves',
    color: 'green',
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-800',
  },
  base: {
    label: 'Base',
    emoji: '🔵',
    swim: [2, 4],
    bike: [60, 100],
    run: [15, 25],
    hours: [4, 6],
    swimSessions: '2 sesiones',
    bikeSessions: '2-3 salidas',
    runSessions: '3-4 sesiones',
    color: 'blue',
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-800',
  },
  construccion: {
    label: 'Construcción',
    emoji: '🟠',
    swim: [4, 6],
    bike: [100, 180],
    run: [25, 40],
    hours: [6, 9],
    swimSessions: '2-3 sesiones',
    bikeSessions: '3-4 salidas',
    runSessions: '3-4 sesiones',
    color: 'orange',
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    text: 'text-orange-800',
  },
  pico: {
    label: 'Pico',
    emoji: '🔴',
    swim: [5, 8],
    bike: [150, 220],
    run: [35, 50],
    hours: [8, 11],
    swimSessions: '3 sesiones',
    bikeSessions: '4 salidas',
    runSessions: '4-5 sesiones',
    color: 'red',
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-800',
  },
};

export default function ConsejosPage() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('reinicio');

  // Cargar fase guardada del navegador
  useEffect(() => {
    const saved = localStorage.getItem('irontrack_phase') as Phase;
    if (saved && PHASES[saved]) {
      setPhase(saved);
    }
  }, []);

  // Guardar fase cuando cambia
  useEffect(() => {
    localStorage.setItem('irontrack_phase', phase);
  }, [phase]);

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  async function loadWeeklyStats() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('activities')
      .select('tipo, distancia_km, duracion_min, fecha')
      .gte('fecha', monday.toISOString().split('T')[0]);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const s: WeeklyStats = { swim_km: 0, bike_km: 0, run_km: 0, total_km: 0, total_min: 0 };

    data.forEach((a: Activity) => {
      const km = Number(a.distancia_km) || 0;
      const min = Number(a.duracion_min) || 0;
      if (a.tipo === 'Natación') s.swim_km += km;
      if (a.tipo === 'Ciclismo') s.bike_km += km;
      if (a.tipo === 'Running') s.run_km += km;
      s.total_km += km;
      s.total_min += min;
    });

    setStats(s);
    setLoading(false);
  }

  function getTips(stats: WeeklyStats, p: PhaseConfig) {
    const tips: { titulo: string; mensaje: string; color: string }[] = [];

    // NATACIÓN
    if (stats.swim_km < p.swim[0] * 0.5) {
      tips.push({
        titulo: `🏊 Natación: casi nada`,
        mensaje: `Llevas ${stats.swim_km.toFixed(1)} km. En fase ${p.label.toLowerCase()} busca ${p.swim[0]}-${p.swim[1]} km. Empieza con 1 sesión corta de técnica.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.swim_km >= p.swim[0] && stats.swim_km <= p.swim[1]) {
      tips.push({
        titulo: `🏊 Natación: en rango ${p.label.toLowerCase()}`,
        mensaje: `¡Bien! ${stats.swim_km.toFixed(1)} km está dentro del rango ${p.swim[0]}-${p.swim[1]} km.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.swim_km > p.swim[1]) {
      tips.push({
        titulo: `🏊 Natación: por encima`,
        mensaje: `${stats.swim_km.toFixed(1)} km supera el rango de ${p.label.toLowerCase()}. No pasa nada, pero no fuerces más si estás recuperándote.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: `🏊 Natación: progresando`,
        mensaje: `Llevas ${stats.swim_km.toFixed(1)} km. Meta: ${p.swim[0]}-${p.swim[1]} km. Añade una sesión más cuando puedas.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    // CICLISMO
    if (stats.bike_km < p.bike[0] * 0.6) {
      tips.push({
        titulo: `🚴 Ciclismo: bajo`,
        mensaje: `Llevas ${stats.bike_km.toFixed(1)} km. Para ${p.label.toLowerCase()}: ${p.bike[0]}-${p.bike[1]} km. Una salida larga suave ayuda.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.bike_km >= p.bike[0] && stats.bike_km <= p.bike[1]) {
      tips.push({
        titulo: `🚴 Ciclismo: en rango ${p.label.toLowerCase()}`,
        mensaje: `¡Perfecto! ${stats.bike_km.toFixed(1)} km está bien para esta fase.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.bike_km > p.bike[1]) {
      tips.push({
        titulo: `🚴 Ciclismo: alto`,
        mensaje: `${stats.bike_km.toFixed(1)} km es mucho para ${p.label.toLowerCase()}. Cuidado con la fatiga.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: `🚴 Ciclismo: subiendo`,
        mensaje: `Llevas ${stats.bike_km.toFixed(1)} km. Meta: ${p.bike[0]}-${p.bike[1]} km. Aumenta progresivamente.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    // RUNNING
    if (stats.run_km < p.run[0] * 0.6) {
      tips.push({
        titulo: `🏃 Running: retomando`,
        mensaje: `Llevas ${stats.run_km.toFixed(1)} km. Meta ${p.label.toLowerCase()}: ${p.run[0]}-${p.run[1]} km. Caminar+correr alternando está perfecto.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.run_km >= p.run[0] && stats.run_km <= p.run[1]) {
      tips.push({
        titulo: `🏃 Running: en rango ${p.label.toLowerCase()}`,
        mensaje: `¡Bien! ${stats.run_km.toFixed(1)} km está en el rango ideal.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.run_km > p.run[1]) {
      tips.push({
        titulo: `🏃 Running: por encima`,
        mensaje: `${stats.run_km.toFixed(1)} km supera lo recomendado. Si es intencional, ok. Si no, baja un poco.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: `🏃 Running: progresando`,
        mensaje: `Llevas ${stats.run_km.toFixed(1)} km. Meta: ${p.run[0]}-${p.run[1]} km. No subas más de 10% por semana.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    // TOTAL HORAS
    const totalHoras = stats.total_min / 60;
    if (totalHoras < p.hours[0]) {
      tips.push({
        titulo: `⏱️ Volumen total`,
        mensaje: `Llevas ${totalHoras.toFixed(1)} horas. Para ${p.label.toLowerCase()}: ${p.hours[0]}-${p.hours[1]} horas/semana.`,
        color: 'bg-orange-100 border-orange-400 text-orange-800',
      });
    } else if (totalHoras >= p.hours[0] && totalHoras <= p.hours[1]) {
      tips.push({
        titulo: `⏱️ Volumen total: ideal`,
        mensaje: `¡Excelente! ${totalHoras.toFixed(1)} horas está perfecto para fase ${p.label.toLowerCase()}.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (totalHoras > p.hours[1]) {
      tips.push({
        titulo: `⏱️ Volumen total: alto`,
        mensaje: `${totalHoras.toFixed(1)} horas supera el rango. Revisa recuperación.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    }

    return tips;
  }

  const currentPhase = PHASES[phase];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando análisis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Consejos de entrenamiento</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Volver al Dashboard
          </Link>
        </div>

        <p className="text-gray-600 mb-6">
          Análisis basado en tu volumen semanal actual. Selecciona tu fase de entrenamiento.
        </p>

        {/* SELECTOR DE FASE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {(Object.keys(PHASES) as Phase[]).map((p) => {
            const isActive = p === phase;
            return (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`rounded-lg p-3 text-center border-2 transition font-semibold text-sm ${
                  isActive
                    ? `${PHASES[p].bg} ${PHASES[p].border} ${PHASES[p].text} shadow-md`
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg mb-1">{PHASES[p].emoji}</div>
                {PHASES[p].label}
              </button>
            );
          })}
        </div>

        {/* VOLUMEN ACTUAL */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.swim_km.toFixed(1)}</p>
              <p className="text-sm text-gray-500">km Natación</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.bike_km.toFixed(1)}</p>
              <p className="text-sm text-gray-500">km Ciclismo</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.run_km.toFixed(1)}</p>
              <p className="text-sm text-gray-500">km Running</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{(stats.total_min / 60).toFixed(1)}</p>
              <p className="text-sm text-gray-500">Horas totales</p>
            </div>
          </div>
        )}

        {/* CONSEJOS DINÁMICOS */}
        <div className="space-y-4 mb-8">
          {stats &&
            getTips(stats, currentPhase).map((tip, i) => (
              <div
                key={i}
                className={`rounded-lg border-l-4 p-4 shadow-sm ${tip.color}`}
              >
                <h3 className="font-bold text-lg mb-1">{tip.titulo}</h3>
                <p className="text-sm leading-relaxed">{tip.mensaje}</p>
              </div>
            ))}
        </div>

        {/* RANGOS OBJETIVO DINÁMICOS */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            📋 Rangos objetivo · <span className={currentPhase.text}>{currentPhase.label}</span>
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              🏊 <strong>Natación:</strong> {currentPhase.swim[0]}-{currentPhase.swim[1]} km/semana ({currentPhase.swimSessions})
            </li>
            <li>
              🚴 <strong>Ciclismo:</strong> {currentPhase.bike[0]}-{currentPhase.bike[1]} km/semana ({currentPhase.bikeSessions})
            </li>
            <li>
              🏃 <strong>Running:</strong> {currentPhase.run[0]}-{currentPhase.run[1]} km/semana ({currentPhase.runSessions})
            </li>
            <li>
              ⏱️ <strong>Total semanal:</strong> {currentPhase.hours[0]}-{currentPhase.hours[1]} horas
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}