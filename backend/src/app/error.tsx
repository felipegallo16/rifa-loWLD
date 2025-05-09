'use client';

import React from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Opcionalmente, registra el error en un servicio de análisis
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-red-600 mb-4">¡Ups!</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          Algo salió mal
        </h2>
        <p className="text-gray-500 mb-8">
          {error.message || 'Ha ocurrido un error inesperado.'}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-left">
            <p className="text-sm font-mono text-gray-600">{error.stack}</p>
          </div>
        )}
      </div>
    </div>
  );
} 