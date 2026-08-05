import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4 text-white">IronTrack</h1>
      <p className="text-xl text-slate-400 mb-8">Tu plataforma de entrenamiento para triatlón</p>
      
      <div className="flex gap-4">
        <Link 
          href="/login"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
        >
          Iniciar Sesión
        </Link>
        <Link 
          href="/register"
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition"
        >
          Registrarse
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        <div className="p-6 bg-slate-800 rounded-xl">
          <div className="text-3xl mb-2">🏊‍♂️</div>
          <h3 className="font-semibold text-blue-400">Natación</h3>
          <p className="text-sm text-slate-400">Registra tus sesiones en el agua</p>
        </div>
        <div className="p-6 bg-slate-800 rounded-xl">
          <div className="text-3xl mb-2">🚴‍♂️</div>
          <h3 className="font-semibold text-amber-400">Ciclismo</h3>
          <p className="text-sm text-slate-400">Sigue tu progreso en la bici</p>
        </div>
        <div className="p-6 bg-slate-800 rounded-xl">
          <div className="text-3xl mb-2">🏃‍♂️</div>
          <h3 className="font-semibold text-red-400">Running</h3>
          <p className="text-sm text-slate-400">Controla tus carreras</p>
        </div>
      </div>
    </div>
  )
}