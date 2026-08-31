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

export default function ConsejosPage() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  function getTips(stats: WeeklyStats) {
    const tips: { titulo: string; mensaje: string; color: string }[] = [];

    if (stats.swim_km < 4) {
      tips.push({
        titulo: '🏊 Natación: volumen bajo',
        mensaje: `Llevas ${stats.swim_km.toFixed(1)} km esta semana. Para el Ironman 51.50 necesitas ~6-10 km/semana. Intenta sumar 2 sesiones más de técnica.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.swim_km >= 6 && stats.swim_km <= 10) {
      tips.push({
        titulo: '🏊 Natación: en rango óptimo',
        mensaje: `¡Excelente! ${stats.swim_km.toFixed(1)} km esta semana. Mantén la frecuencia y añade series de velocidad si te sientes cómodo.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.swim_km > 12) {
      tips.push({
        titulo: '🏊 Natación: volumen alto',
        mensaje: `${stats.swim_km.toFixed(1)} km es mucho para esta etapa. Asegúrate de descansar y no acumular fatiga innecesaria.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: '🏊 Natación: progresando',
        mensaje: `Llevas ${stats.swim_km.toFixed(1)} km. Estás cerca del rango óptimo (6-10 km). Añade una sesión más esta semana.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    if (stats.bike_km < 100) {
      tips.push({
        titulo: '🚴 Ciclismo: volumen bajo',
        mensaje: `Llevas ${stats.bike_km.toFixed(1)} km. Para 90 km de competencia, apunta a 150-250 km/semana. Aumenta progresivamente en +10% semanal.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.bike_km >= 150 && stats.bike_km <= 250) {
      tips.push({
        titulo: '🚴 Ciclismo: en rango óptimo',
        mensaje: `¡Muy bien! ${stats.bike_km.toFixed(1)} km esta semana. Es un buen momento para incluir series de umbral o rodillo con potencia.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.bike_km > 300) {
      tips.push({
        titulo: '🚴 Ciclismo: volumen alto',
        mensaje: `${stats.bike_km.toFixed(1)} km puede ser excesivo sin descanso. Prioriza calidad sobre cantidad y monitorea fatiga.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: '🚴 Ciclismo: progresando',
        mensaje: `Llevas ${stats.bike_km.toFixed(1)} km. Buena base, intenta llegar a 150 km con una salida larga de fin de semana.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    if (stats.run_km < 25) {
      tips.push({
        titulo: '🏃 Running: volumen bajo',
        mensaje: `Llevas ${stats.run_km.toFixed(1)} km. Para medio maratón (21.1 km), necesitas 40-60 km/semana. No subas más de 10% por semana.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.run_km >= 40 && stats.run_km <= 60) {
      tips.push({
        titulo: '🏃 Running: en rango óptimo',
        mensaje: `¡Perfecto! ${stats.run_km.toFixed(1)} km esta semana. Mantén una carrera larga de 12-15 km y añade fartlek.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.run_km > 70) {
      tips.push({
        titulo: '🏃 Running: volumen alto',
        mensaje: `${stats.run_km.toFixed(1)} km es alto. El running impacta mucho. Asegúrate de tener 1-2 días de descanso o natación suave.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: '🏃 Running: progresando',
        mensaje: `Llevas ${stats.run_km.toFixed(1)} km. Buen trabajo, intenta llegar a 40 km con una sesión de calidad (intervalos o cuestas).`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    const totalHoras = stats.total_min / 60;
    if (totalHoras < 6) {
      tips.push({
        titulo: '⏱️ Volumen total semanal',
        mensaje: `Llevas ${totalHoras.toFixed(1)} horas. Para Ironman 51.50, apunta a 8-12 horas/semana en fase de construcción.`,
        color: 'bg-orange-100 border-orange-400 text-orange-800',
      });
    } else if (totalHoras >= 8 && totalHoras <= 14) {
      tips.push({
        titulo: '⏱️ Volumen total semanal',
        mensaje: `¡Excelente! ${totalHoras.toFixed(1)} horas esta semana. Distribución ideal para Ironman 51.50.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    }

    return tips;
  }

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
          Análisis basado en tu volumen semanal actual. Objetivo: Ironman 51.50 Cartagena.
        </p>

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

        <div className="space-y-4">
          {stats && getTips(stats).map((tip, i) => (
            <div key={i} className={`rounded-lg border-l-4 p-4 shadow-sm ${tip.color}`}>
              <h3 className="font-bold text-lg mb-1">{tip.titulo}</h3>
              <p className="text-sm leading-relaxed">{tip.mensaje}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">📋 Rangos objetivo (Ironman 51.50)</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>🏊 <strong>Natación:</strong> 6-10 km/semana (3-5 sesiones)</li>
            <li>🚴 <strong>Ciclismo:</strong> 150-250 km/semana (3-4 sesiones)</li>
            <li>🏃 <strong>Running:</strong> 40-60 km/semana (3-4 sesiones)</li>
            <li>⏱️ <strong>Total semanal:</strong> 8-12 horas en fase de construcción</li>
          </ul>
        </div>
      </div>
    </div>
  );
}