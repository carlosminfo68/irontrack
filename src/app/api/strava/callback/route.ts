import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // 1. Validar que venga el code de Strava
  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url))
  }

  // 2. Decodificar el user_id que venía en el state (base64)
  let userId: string | null = null
  try {
    if (state) {
      userId = Buffer.from(state, 'base64').toString('utf-8')
    }
  } catch {
    userId = null
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/dashboard?error=no_user', request.url))
  }

  // 3. Validar que tenemos las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const stravaClientId = process.env.STRAVA_CLIENT_ID
  const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!supabaseUrl || !supabaseServiceKey || !stravaClientId || !stravaClientSecret) {
    console.error('[Strava Callback] Faltan variables de entorno')
    return NextResponse.redirect(new URL('/dashboard?error=env_missing', request.url))
  }

  try {
    // 4. Intercambiar el code por tokens en Strava
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Strava Callback] Error de token:', tokenData.error)
      return NextResponse.redirect(new URL('/dashboard?error=strava_token', request.url))
    }

    // 5. Conectar a Supabase con Service Role Key (ignora RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 6. Preparar los datos a guardar
    // Strava devuelve expires_at en segundos (Unix timestamp)
    const expiresAtISO = new Date(tokenData.expires_at * 1000).toISOString()

    const connectionData = {
      user_id: userId,
      strava_athlete_id: tokenData.athlete?.id || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAtISO,
    }

    console.log('[Strava Callback] Guardando conexión para user:', userId)

    // 7. UPSERT: si ya existe, la actualiza; si no, la crea
    const { error: upsertError } = await supabase
      .from('strava_connections')
      .upsert(connectionData, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('[Strava Callback] Error guardando en Supabase:', upsertError)
      return NextResponse.redirect(new URL('/dashboard?error=db_save', request.url))
    }

    console.log('[Strava Callback] ✅ Conexión guardada exitosamente')
    return NextResponse.redirect(new URL('/dashboard?strava=connected', request.url))

  } catch (error) {
    console.error('[Strava Callback] Error general:', error)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', request.url))
  }
}