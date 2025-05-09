'use client';

import { useState } from 'react';

export default function WorldIDButton() {
  return (
    <div className="text-center mb-8">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-medium">Esta aplicación solo está disponible dentro de World App</p>
        <p className="text-sm mt-2">Por favor, abre esta aplicación desde World App para participar</p>
      </div>
    </div>
  );
} 