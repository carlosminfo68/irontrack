import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const STRAVA_API = 'https://www.strava.com/api/v3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'Falta user_id' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Buscar la conexión de Strava del usuario
  const { data: connection, error: connError } = await supabase
    .from('strava_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (connError || !connection) {
    return NextResponse.json({ error: 'No hay conexión con Strava' }, { status: 404 })
  }

  let accessToken = connection.access_token

  // 2. Verificar si el token expiró y refrescarlo si es necesario
  const now = new Date()
  const expiresAt = new Date(connection.expires_at)

  if (now >= expiresAt) {
    console.log('[Strava Sync] Token expirado, refrescando...')
    const refreshRes = await fetch(`${STRAVA_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const refreshData = await refreshRes.json()

    if (refreshData.error || !refreshData.access_token) {
      return NextResponse.json({ error: 'No se pudo refrescar el token de Strava' }, { status: 401 })
    }

    // Guardar el nuevo token
    accessToken = refreshData.access_token
    const newExpiresAt = new Date(refreshData.expires_at * 1000).toISOString()

    await supabase
      .from('strava_connections')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_at: newExpiresAt,
      })
      .eq('user_id', userId)

    console.log('[Strava Sync] Token refrescado correctamente')
  }

  // 3. Pedir actividades a Strava (últimas 30)
  try {
    const activitiesRes = await fetch(
      `${STRAVA_API}/athlete/activities?per_page=30`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!activitiesRes.ok) {
      const errText = await activitiesRes.text()
      console.error('[Strava Sync] Error API Strava:', errText)
      return NextResponse.json({ error: 'Error al obtener actividades de Strava' }, { status: 502 })
    }

    const stravaActivities = await activitiesRes.json()

    if (!Array.isArray(stravaActivities) || stravaActivities.length === 0) {
      return NextResponse.json({ message: 'No hay actividades nuevas en Strava', count: 0 })
    }

    // 4. Mapear actividades de Strava a nuestra tabla
    const activitiesToInsert = stravaActivities.map((act: any) => {
      // Convertir metros a km, segundos a minutos
      const distanciaKm = act.distance ? parseFloat((act.distance / 1000).toFixed(2)) : 0
      const duracionMin = act.moving_time ? Math.round(act.moving_time / 60) : 0
      const elevacionM = act.total_elevation_gain || 0
      const velocidadMedia = act.average_speed ? parseFloat((act.average_speed * 3.6).toFixed(2)) : null // m/s a km/h

      // Mapear tipo de Strava a nuestros tipos
      let tipo = 'Otro'
      if (act.type === 'Run' || act.type === 'VirtualRun') tipo = 'Running'
      else if (act.type === 'Ride' || act.type === 'VirtualRide') tipo = 'Ciclismo'
      else if (act.type === 'Swim') tipo = 'Natación'

      return {
        user_id: userId,
        strava_activity_id: act.id,
        tipo,
        titulo: act.name || 'Sin título',
        distancia_km: distanciaKm,
        duracion_minutos: duracionMin,
        fecha: act.start_date,
        elevacion_m: elevacionM,
        velocidad_media_kmh: velocidadMedia,
        fc_media: act.average_heartrate || null,
      }
    })

    // 5. Guardar en Supabase (upsert para no duplicar)
    const { error: insertError } = await supabase
      .from('activities')
      .upsert(activitiesToInsert, { onConflict: 'strava_activity_id' })

    if (insertError) {
      console.error('[Strava Sync] Error guardando en Supabase:', insertError)
      return NextResponse.json({ error: 'Error guardando actividades' }, { status: 500 })
    }

    console.log(`[Strava Sync] ✅ ${activitiesToInsert.length} actividades sincronizadas`)
    return NextResponse.json({
      message: `${activitiesToInsert.length} actividades sincronizadas`,
      count: activitiesToInsert.length,
    })

  } catch (error) {
    console.error('[Strava Sync] Error general:', error)
    return NextResponse.json({ error: 'Error en la sincronización' }, { status: 500 })
  }
}