import { useState } from 'react';
import { MENU_DATA } from './data/menu';
import { supabase } from './supabaseClient';
import Admin from './Admin';

export default function App() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [viewAdmin, setViewAdmin] = useState(false);

  // Mode Pemesanan ('Dine-in', 'Pick-up', 'Delivery')
  const [tipePesanan, setTipePesanan] = useState('Dine-in');
  const [namaPembeli, setNamaPembeli] = useState('');
  const [nomorMeja, setNomorMeja] = useState('');
  const [jamPickup, setJamPickup] = useState('');
  const [alamatDelivery, setAlamatDelivery] = useState('');

  // State Modal Kustomisasi (Tambah & Edit)
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingCartItemId, setEditingCartItemId] = useState(null);
  const [jenisMie, setJenisMie] = useState('Mie Kuning / Pipih');
  const [sayurToge, setSayurToge] = useState('Lengkap (Sayur + Tauge)');
  const [catatan, setCatatan] = useState('');

  const NOMOR_WA_TOKO = "6281234567890"; // Ganti dengan nomor WhatsApp toko kamu
  const categories = ['Semua', 'Bakso', 'Mie', 'Minuman', 'Tambahan'];

  if (viewAdmin) {
    return <Admin onBack={() => setViewAdmin(false)} />;
  }

  const filteredMenu = activeCategory === 'Semua' 
    ? MENU_DATA 
    : MENU_DATA.filter((item) => item.kategori === activeCategory);

  // Open Modal Tambah Baru
  const handleOpenModal = (item) => {
    if (item.kategori === 'Minuman' || item.kategori === 'Tambahan') {
      addToCartDirect(item);
    } else {
      setSelectedItem(item);
      setEditingCartItemId(null);
      setJenisMie('Mie Kuning / Pipih');
      setSayurToge('Lengkap (Sayur + Tauge)');
      setCatatan('');
    }
  };

  // Open Modal Edit Item
  const handleEditCartItem = (cartItem) => {
    const originalMenuItem = MENU_DATA.find((m) => m.id === cartItem.id);
    setSelectedItem(originalMenuItem || cartItem);
    setEditingCartItemId(cartItem.cartItemId);
    
    if (cartItem.customOptions) {
      setJenisMie(cartItem.customOptions.jenisMie || 'Mie Kuning / Pipih');
      setSayurToge(cartItem.customOptions.sayurToge || 'Lengkap (Sayur + Tauge)');
      setCatatan(cartItem.customOptions.catatan || '');
    }
  };

  // Hapus Item dari Keranjang
  const handleRemoveFromCart = (cartItemId) => {
    setCart(cart.filter((c) => c.cartItemId !== cartItemId));
  };

  // Tambah Langsung (Tanpa Modal)
  const addToCartDirect = (item) => {
    const cartItemId = `${item.id}-default`;
    const existing = cart.find((c) => c.cartItemId === cartItemId);

    if (existing) {
      setCart(cart.map((c) => c.cartItemId === cartItemId ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, cartItemId, qty: 1 }]);
    }
  };

  // Simpan Kustomisasi (Tambah vs Edit)
  const handleConfirmCustomization = () => {
    if (editingCartItemId) {
      setCart(cart.map((item) => {
        if (item.cartItemId === editingCartItemId) {
          const newCartItemId = `${item.id}-${jenisMie}-${sayurToge}-${catatan}`;
          return {
            ...item,
            cartItemId: newCartItemId,
            customOptions: { jenisMie, sayurToge, catatan }
          };
        }
        return item;
      }));
    } else {
      const cartItemId = `${selectedItem.id}-${jenisMie}-${sayurToge}-${catatan}`;
      const existing = cart.find((c) => c.cartItemId === cartItemId);

      if (existing) {
        setCart(cart.map((c) => c.cartItemId === cartItemId ? { ...c, qty: c.qty + 1 } : c));
      } else {
        setCart([
          ...cart,
          {
            ...selectedItem,
            cartItemId,
            qty: 1,
            customOptions: { jenisMie, sayurToge, catatan }
          }
        ]);
      }
    }

    setSelectedItem(null);
    setEditingCartItemId(null);
  };

  const totalHarga = cart.reduce((acc, curr) => acc + curr.harga * curr.qty, 0);

  // LOGIKA CHECKOUT (DINE-IN KASIR vs TAKEAWAY WA)
  const handleCheckout = async () => {
    if (!namaPembeli.trim()) {
      alert("Harap isi nama pemesan terlebih dahulu!");
      return;
    }

    // 1. DINE-IN (MAKAN DI TEMPAT) -> Kirim ke Supabase Kasir
    if (tipePesanan === 'Dine-in') {
      if (!nomorMeja.trim()) {
        alert("Harap isi nomor meja untuk pemesanan makan di tempat!");
        return;
      }

      const { error } = await supabase.from('orders').insert([
        {
          nama_pembeli: namaPembeli,
          tipe_pesanan: 'Dine-in',
          nomor_meja: nomorMeja,
          items: cart,
          total_harga: totalHarga,
          status: 'Masuk'
        }
      ]);

      if (error) {
        alert("Gagal mengirim pesanan ke kasir, silakan coba lagi.");
        console.error(error);
        return;
      }

      alert(`✅ Pesanan berhasil dikirim ke kasir!\n\nNama: ${namaPembeli}\nMeja: ${nomorMeja}\nMohon tunggu pesanan disajikan ya 🙏`);
      setCart([]);
      setNamaPembeli('');
      setNomorMeja('');
    } 
    
    // 2. TAKEAWAY (PICK-UP / DELIVERY) -> Kirim ke WhatsApp Toko
    else {
      if (tipePesanan === 'Pick-up' && !jamPickup.trim()) {
        alert("Harap isi estimasi jam pengambilan!");
        return;
      }
      if (tipePesanan === 'Delivery' && !alamatDelivery.trim()) {
        alert("Harap isi alamat pengiriman lengkap!");
        return;
      }

      let pesan = `Halo *AGITA BASO*! Saya mau pesan makanan:\n\n`;
      pesan += `👤 *Nama Pemesan:* ${namaPembeli}\n`;
      
      if (tipePesanan === 'Pick-up') {
        pesan += `🛍️ *Metode:* Pick-Up (Ambil Sendiri di Toko)\n`;
        pesan += `⏰ *Jam Ambil:* ${jamPickup}\n`;
      } else {
        pesan += `🛵 *Metode:* Delivery (GoSend / GrabExpress / dkk)\n`;
        pesan += `📍 *Alamat Kirim:* ${alamatDelivery}\n`;
      }

      pesan += `-----------------------------------\n`;
      pesan += `📋 *RINCIAN PESANAN:*\n\n`;

      cart.forEach((item, index) => {
        pesan += `${index + 1}. *${item.nama}* x${item.qty}\n`;
        if (item.customOptions) {
          pesan += `   - Mie: ${item.customOptions.jenisMie}\n`;
          pesan += `   - Sayur: ${item.customOptions.sayurToge}\n`;
          if (item.customOptions.catatan) {
            pesan += `   - Catatan: ${item.customOptions.catatan}\n`;
          }
        }
        pesan += `   Subtotal: Rp ${(item.harga * item.qty).toLocaleString('id-ID')}\n\n`;
      });

      pesan += `-----------------------------------\n`;
      pesan += `💰 *TOTAL BAKSO: Rp ${totalHarga.toLocaleString('id-ID')}*\n`;
      if (tipePesanan === 'Delivery') {
        pesan += `_(Ongkir ojol akan dihitung via WhatsApp)_\n\n`;
      } else {
        pesan += `\n`;
      }
      pesan += `Mohon konfirmasi pesanan ini ya, terima kasih! 🙏`;

      const urlWhatsApp = `https://wa.me/${NOMOR_WA_TOKO}?text=${encodeURIComponent(pesan)}`;
      window.open(urlWhatsApp, '_blank');

      setCart([]);
      setNamaPembeli('');
      setJamPickup('');
      setAlamatDelivery('');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 pb-12">
      {/* Header */}
      <header className="bg-red-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-10 h-10 rounded-full border-2 border-amber-300 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-xl font-bold leading-none">AGITA BASO</h1>
              <p className="text-[10px] text-amber-200 mt-0.5">Makan Di Tempat & Bungkus</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-800 px-3 py-1.5 rounded-full text-sm font-semibold">
              🛒 Keranjang ({cart.reduce((a, b) => a + b.qty, 0)})
            </div>
            <button
              onClick={() => setViewAdmin(true)}
              className="bg-slate-900 hover:bg-slate-950 px-3 py-1.5 rounded-full text-xs font-bold transition"
            >
              🔑 Kasir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        <div className="md:col-span-2 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-red-700 text-white shadow-md scale-105'
                    : 'bg-white text-slate-600 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMenu.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden flex flex-col justify-between">
                <img src={item.image} alt={item.nama} className="h-32 w-full object-cover" />
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {item.kategori}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-1">{item.nama}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.deskripsi}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-red-700 text-sm">
                      Rp {item.harga.toLocaleString('id-ID')}
                    </span>
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition active:scale-95"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Keranjang Belanja */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 h-fit sticky top-20">
          <h2 className="text-lg font-bold border-b pb-2 text-slate-900">Pesanan Kamu</h2>
          {cart.length === 0 ? (
            <p className="text-xs text-slate-400 my-6 text-center">Keranjang masih kosong nih.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {cart.map((item) => (
                <div key={item.cartItemId} className="border-b pb-2.5 space-y-1">
                  <div className="flex justify-between items-start text-sm">
                    <p className="font-semibold text-slate-800">{item.nama}</p>
                    <span className="font-bold text-slate-700 text-xs">
                      Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {item.customOptions && (
                    <p className="text-[11px] text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 block">
                      • Mie: {item.customOptions.jenisMie}<br/>
                      • Sayur: {item.customOptions.sayurToge}
                      {item.customOptions.catatan && <><br/>• Catatan: {item.customOptions.catatan}</>}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-1 text-xs text-slate-500">
                    <span>{item.qty} x Rp {item.harga.toLocaleString('id-ID')}</span>
                    
                    <div className="flex items-center gap-2">
                      {item.customOptions && (
                        <button
                          onClick={() => handleEditCartItem(item)}
                          className="text-amber-700 hover:text-amber-900 text-[11px] font-bold underline"
                        >
                          ✏️ Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFromCart(item.cartItemId)}
                        className="text-red-600 hover:text-red-800 text-[11px] font-bold underline"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-2 flex justify-between items-center font-bold text-base text-red-900">
                <span>Total:</span>
                <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
              </div>

              {/* Form Opsi Pemesanan (3 Pilihan) */}
              <div className="pt-2 border-t space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Pilih Mode Pemesanan:</label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setTipePesanan('Dine-in')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition ${
                      tipePesanan === 'Dine-in' ? 'bg-red-700 text-white border-red-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🪑 Di Tempat
                  </button>
                  <button
                    onClick={() => setTipePesanan('Pick-up')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition ${
                      tipePesanan === 'Pick-up' ? 'bg-red-700 text-white border-red-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🛍️ Pick-Up
                  </button>
                  <button
                    onClick={() => setTipePesanan('Delivery')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition ${
                      tipePesanan === 'Delivery' ? 'bg-red-700 text-white border-red-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🛵 Delivery
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Nama Pemesan..."
                  value={namaPembeli}
                  onChange={(e) => setNamaPembeli(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
                />

                {tipePesanan === 'Dine-in' && (
                  <input
                    type="text"
                    placeholder="Nomor Meja (misal: Meja 03)..."
                    value={nomorMeja}
                    onChange={(e) => setNomorMeja(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
                  />
                )}

                {tipePesanan === 'Pick-up' && (
                  <input
                    type="text"
                    placeholder="Estimasi Jam Ambil (misal: Jam 12.30)..."
                    value={jamPickup}
                    onChange={(e) => setJamPickup(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
                  />
                )}

                {tipePesanan === 'Delivery' && (
                  <textarea
                    rows="2"
                    placeholder="Alamat Pengiriman Lengkap (untuk GoSend/GrabExpress)..."
                    value={alamatDelivery}
                    onChange={(e) => setAlamatDelivery(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
                  />
                )}
              </div>

              {/* Tombol Checkout Dinamis */}
              <button
                onClick={handleCheckout}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 mt-2 text-white ${
                  tipePesanan === 'Dine-in' 
                    ? 'bg-red-700 hover:bg-red-800' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {tipePesanan === 'Dine-in' ? (
                  <span>🔔 Kirim Pesanan ke Kasir</span>
                ) : (
                  <span>💬 Pesan via WhatsApp</span>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* POP-UP MODAL KUSTOMISASI */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingCartItemId ? `✏️ Edit ${selectedItem.nama}` : selectedItem.nama}
                </h3>
                <p className="text-xs text-red-700 font-bold">
                  Rp {selectedItem.harga.toLocaleString('id-ID')}
                </p>
              </div>
              <button 
                onClick={() => { setSelectedItem(null); setEditingCartItemId(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* OPSI 1: MIE / BIHUN */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilihan Mie / Bihun:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Mie Kuning / Pipih', 
                  'Bihun Saja', 
                  'Mix (Mie + Bihun)',
                  'Tanpa Mie'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setJenisMie(option)}
                    className={`py-1.5 px-2 text-xs rounded-lg border font-medium text-center transition ${
                      jenisMie === option 
                        ? 'border-red-600 bg-red-50 text-red-700 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* OPSI 2: SAYUR / TAUGE */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilihan Sayur / Tauge:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Lengkap (Sayur + Tauge)',
                  'Sayur Saja',
                  'Tauge Saja',
                  'Tanpa Sayur & Tauge'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSayurToge(option)}
                    className={`py-1.5 px-2 text-xs rounded-lg border font-medium text-center transition ${
                      sayurToge === option 
                        ? 'border-red-600 bg-red-50 text-red-700 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* OPSI 3: CATATAN */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional):</label>
              <input
                type="text"
                placeholder="Misal: Sambal dipisah, kuah dipisah..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => { setSelectedItem(null); setEditingCartItemId(null); }}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow"
              >
                {editingCartItemId ? 'Simpan Perubahan' : 'Tambahkan ke Keranjang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}