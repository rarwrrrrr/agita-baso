import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Admin({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-xl font-bold">🔑 Dashboard Kasir AGITA BASO</h1>
          <button
            onClick={onBack}
            className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg font-bold"
          >
            ← Kembali ke Menu
          </button>
        </div>

        {loading ? (
          <p className="text-center py-8 text-sm text-slate-500">Memuat pesanan masuk...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-slate-400 text-sm">
            Belum ada pesanan Makan di Tempat (Dine-in).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
                <div className="flex justify-between items-start border-b pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{order.nama_pembeli}</h3>
                    <p className="text-xs text-red-700 font-bold">📍 {order.nomor_meja}</p>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    {order.status || 'Masuk'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-100 pb-1">
                      <span>{item.qty}x {item.nama}</span>
                      <span className="font-semibold">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 font-bold text-sm">
                  <span>Total:</span>
                  <span className="text-red-700">Rp {Number(order.total_harga).toLocaleString('id-ID')}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => updateStatus(order.id, 'Selesai')}
                    className="flex-1 bg-emerald-600 text-white text-xs py-1.5 rounded font-bold hover:bg-emerald-700"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}