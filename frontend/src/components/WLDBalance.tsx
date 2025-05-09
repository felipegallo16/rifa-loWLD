'use client';

import { useState, useEffect } from 'react';

interface WLDTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

interface WLDBalanceProps {
  nullifierHash: string;
}

export default function WLDBalance({ nullifierHash }: WLDBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WLDTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalanceAndTransactions = async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          fetch(`/api/balance/${nullifierHash}`),
          fetch(`/api/transactions/${nullifierHash}`)
        ]);

        const balanceData = await balanceRes.json();
        const transactionsData = await transactionsRes.json();

        setBalance(balanceData.wld_balance);
        setTransactions(transactionsData.transactions);
      } catch (error) {
        console.error('Error fetching WLD data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (nullifierHash) {
      fetchBalanceAndTransactions();
    }
  }, [nullifierHash]);

  if (loading) {
    return <div className="animate-pulse">Cargando...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Tu Balance WLD</h2>
        <p className="text-3xl font-semibold text-blue-600">
          {balance?.toFixed(2)} WLD
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Historial de Transacciones</h3>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center border-b border-gray-200 py-2"
            >
              <div>
                <p className="font-medium">
                  {tx.type === 'PURCHASE' ? 'Compra de ticket' :
                   tx.type === 'REWARD' ? 'Recompensa' :
                   tx.type === 'REFUND' ? 'Reembolso' : 'Retiro'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} WLD
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No hay transacciones para mostrar
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 