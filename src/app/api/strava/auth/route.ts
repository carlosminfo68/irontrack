import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.redirect(new URL('/dashboard?error=no_user', request.url))
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/strava/callback`
  const scope = 'read,activity:read_all'
  
  // Guardamos el user_id en "state" para recuperarlo cuando Strava nos devuelva
  const state = Buffer.from(userId).toString('base64')
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&approval_prompt=force&state=${state}`
  
  return NextResponse.redirect(authUrl)
}