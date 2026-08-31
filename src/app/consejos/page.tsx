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

    // NATACIÓN (objetivo: 4-6 km/semana para 70.3)
    if (stats.swim_km < 2) {
      tips.push({
        titulo: '🏊 Natación: volumen bajo',
        mensaje: `Llevas ${stats.swim_km.toFixed(1)} km esta semana. Para el 51.50 necesitas ~4-6 km/semana. Intenta nadar 2-3 veces por semana, enfocado en técnica.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.swim_km >= 4 && stats.swim_km <= 6) {
      tips.push({
        titulo: '🏊 Natación: en rango óptimo',
        mensaje: `¡Excelente! ${stats.swim_km.toFixed(1)} km esta semana. Mantén 2-3 sesiones y añade series de velocidad de vez en cuando.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.swim_km > 8) {
      tips.push({
        titulo: '🏊 Natación: volumen alto',
        mensaje: `${stats.swim_km.toFixed(1)} km es alto para 70.3. No acumules fatiga innecesaria; prioriza técnica sobre metros.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: '🏊 Natación: progresando',
        mensaje: `Llevas ${stats.swim_km.toFixed(1)} km. Estás cerca del rango óptimo (4-6 km). Añade una sesión más de técnica.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    // CICLISMO (objetivo: 100-180 km/semana para 70.3)
    if (stats.bike_km < 60) {
      tips.push({
        titulo: '🚴 Ciclismo: volumen bajo',
        mensaje: `Llevas ${stats.bike_km.toFixed(1)} km. Para 90 km de bici en competencia, apunta a 100-180 km/semana. Aumenta progresivamente en +10% semanal.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.bike_km >= 100 && stats.bike_km <= 180) {
      tips.push({
        titulo: '🚴 Ciclismo: en rango óptimo',
        mensaje: `¡Muy bien! ${stats.bike_km.toFixed(1)} km esta semana. Es un buen momento para incluir una salida larga de 60-80 km los fines de semana.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.bike_km > 220) {
      tips.push({
        titulo: '🚴 Ciclismo: volumen alto',
        mensaje: `${stats.bike_km.toFixed(1)} km puede ser excesivo para 70.3 sin descanso. Prioriza calidad sobre cantidad y monitorea fatiga.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: '🚴 Ciclismo: progresando',
        mensaje: `Llevas ${stats.bike_km.toFixed(1)} km. Buena base, intenta llegar a 100 km con una salida larga de fin de semana.`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    // RUNNING (objetivo: 25-40 km/semana para 70.3)
    if (stats.run_km < 15) {
      tips.push({
        titulo: '🏃 Running: volumen bajo',
        mensaje: `Llevas ${stats.run_km.toFixed(1)} km. Para 21.1 km de carrera, necesitas 25-40 km/semana. No subas más de 10% por semana.`,
        color: 'bg-red-100 border-red-400 text-red-800',
      });
    } else if (stats.run_km >= 25 && stats.run_km <= 40) {
      tips.push({
        titulo: '🏃 Running: en rango óptimo',
        mensaje: `¡Perfecto! ${stats.run_km.toFixed(1)} km esta semana. Mantén una carrera larga de 10-12 km y añade fartlek o cuestas.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (stats.run_km > 50) {
      tips.push({
        titulo: '🏃 Running: volumen alto',
        mensaje: `${stats.run_km.toFixed(1)} km es alto para 70.3. El running impacta mucho. Asegúrate de tener 1-2 días de descanso o natación suave.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      });
    } else {
      tips.push({
        titulo: '🏃 Running: progresando',
        mensaje: `Llevas ${stats.run_km.toFixed(1)} km. Buen trabajo, intenta llegar a 25 km con una sesión de calidad (intervalos o cuestas).`,
        color: 'bg-blue-100 border-blue-400 text-blue-800',
      });
    }

    // GENERAL
    const totalHoras = stats.total_min / 60;
    if (totalHoras < 4) {
      tips.push({
        titulo: '⏱️ Volumen total semanal',
        mensaje: `Llevas ${totalHoras.toFixed(1)} horas. Para 51.50, apunta a 6-9 horas/semana en fase de construcción.`,
        color: 'bg-orange-100 border-orange-400 text-orange-800',
      });
    } else if (totalHoras >= 6 && totalHoras <= 9) {
      tips.push({
        titulo: '⏱️ Volumen total semanal',
        mensaje: `¡Excelente! ${totalHoras.toFixed(1)} horas esta semana. Distribución ideal para Ironman 51.50.`,
        color: 'bg-green-100 border-green-400 text-green-800',
      });
    } else if (totalHoras > 12) {
      tips.push({
        titulo: '⏱️ Volumen total semanal',
        mensaje: `${totalHoras.toFixed(1)} horas es mucho para 70.3. Revisa recuperación y descanso para evitar sobreentrenamiento.`,
        color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
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
          <h2 className="text-xl font-bold text-gray-800 mb-3">📋 Rangos objetivo (Ironman 51.50 · 70.3)</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>🏊 <strong>Natación:</strong> 4-6 km/semana (2-3 sesiones)</li>
            <li>🚴 <strong>Ciclismo:</strong> 100-180 km/semana (2-4 sesiones)</li>
            <li>🏃 <strong>Running:</strong> 25-40 km/semana (3-4 sesiones)</li>
            <li>⏱️ <strong>Total semanal:</strong> 6-9 horas en fase de construcción</li>
          </ul>
        </div>
      </div>
    </div>
  );
}