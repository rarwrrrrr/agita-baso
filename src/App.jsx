import { useState } from 'react';
import { MENU_DATA } from './data/menu';

export default function App() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');

  // State untuk Data Pemesan
  const [namaPembeli, setNamaPembeli] = useState('');
  const [nomorMeja, setNomorMeja] = useState('');
  const [tipePesanan, setTipePesanan] = useState('Dine-in'); // Dine-in atau Takeaway

  // State untuk kontrol Modal Pop-up Kustomisasi
  const [selectedItem, setSelectedItem] = useState(null);
  const [pedas, setPedas] = useState('Pedas Sedang');
  const [jenisMie, setJenisMie] = useState('Mie Kuning / Pipih');
  const [catatan, setCatatan] = useState('');

  // NOMOR WHATSAPP TOKO (Ganti angka ini dengan nomor WA bapak, awali dengan 62)
  const NOMOR_WA_TOKO = "6281234567890";

  const categories = ['Semua', 'Bakso', 'Mie', 'Minuman', 'Tambahan'];

  const filteredMenu = activeCategory === 'Semua' 
    ? MENU_DATA 
    : MENU_DATA.filter((item) => item.kategori === activeCategory);

  // Buka Modal Kustomisasi saat tombol + Tambah diklik
  const handleOpenModal = (item) => {
    if (item.kategori === 'Minuman' || item.kategori === 'Tambahan') {
      addToCartDirect(item);
    } else {
      setSelectedItem(item);
      setPedas('Pedas Sedang');
      setJenisMie('Mie Kuning / Pipih');
      setCatatan('');
    }
  };

  // Tambah item biasa tanpa kustomisasi
  const addToCartDirect = (item) => {
    const cartItemId = `${item.id}-default`;
    const existing = cart.find((c) => c.cartItemId === cartItemId);

    if (existing) {
      setCart(cart.map((c) => c.cartItemId === cartItemId ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, cartItemId, qty: 1 }]);
    }
  };

  // Simpan Pesanan dari Modal Pop-up ke Keranjang
  const handleConfirmCustomization = () => {
    const cartItemId = `${selectedItem.id}-${pedas}-${jenisMie}-${catatan}`;
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
          customOptions: { pedas, jenisMie, catatan }
        }
      ]);
    }

    setSelectedItem(null); // Tutup modal
  };

  const totalHarga = cart.reduce((acc, curr) => acc + curr.harga * curr.qty, 0);

  // FUNGSI CHECKOUT KE WHATSAPP
  const handleCheckoutWhatsApp = () => {
    if (!namaPembeli.trim()) {
      alert("Harap isi nama pemesan terlebih dahulu!");
      return;
    }

    if (tipePesanan === 'Dine-in' && !nomorMeja.trim()) {
      alert("Harap isi nomor meja untuk pesanan makan di tempat!");
      return;
    }

    // Format Pesan WhatsApp
    let pesan = `Halo *AGITA BASO*! Saya mau pesan makanan:\n\n`;
    pesan += `👤 *Nama:* ${namaPembeli}\n`;
    pesan += `🍽️ *Tipe:* ${tipePesanan === 'Dine-in' ? `Makan di Tempat (Meja No. ${nomorMeja})` : 'Bungkus / Takeaway'}\n`;
    pesan += `-----------------------------------\n`;
    pesan += `📋 *RINCIAN PESANAN:*\n\n`;

    cart.forEach((item, index) => {
      pesan += `${index + 1}. *${item.nama}* x${item.qty}\n`;
      if (item.customOptions) {
        pesan += `   - Mie: ${item.customOptions.jenisMie}\n`;
        pesan += `   - Pedas: ${item.customOptions.pedas}\n`;
        if (item.customOptions.catatan) {
          pesan += `   - Catatan: ${item.customOptions.catatan}\n`;
        }
      }
      pesan += `   Subtotal: Rp ${(item.harga * item.qty).toLocaleString('id-ID')}\n\n`;
    });

    pesan += `-----------------------------------\n`;
    pesan += `💰 *TOTAL BAYAR: Rp ${totalHarga.toLocaleString('id-ID')}*\n\n`;
    pesan += `Mohon diproses ya, terima kasih! 🙏`;

    const urlWhatsApp = `https://wa.me/${NOMOR_WA_TOKO}?text=${encodeURIComponent(pesan)}`;
    window.open(urlWhatsApp, '_blank');
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 pb-12">
      {/* Header dengan Logo */}
      <header className="bg-red-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-10 h-10 rounded-full border-2 border-amber-300 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1 className="text-xl font-bold">
              AGITA BASO
            </h1>
          </div>
          <div className="bg-red-800 px-3 py-1.5 rounded-full text-sm font-semibold">
            🛒 Keranjang ({cart.reduce((a, b) => a + b.qty, 0)})
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* List Menu & Filter */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Tombol Filter Kategori */}
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

          {/* Grid Menu Terfilter */}
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
                <div key={item.cartItemId} className="flex justify-between items-start text-sm border-b pb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{item.nama}</p>
                    
                    {/* Render opsi kustomisasi jika ada */}
                    {item.customOptions && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 inline-block">
                        {item.customOptions.jenisMie} • {item.customOptions.pedas}
                        {item.customOptions.catatan && ` (${item.customOptions.catatan})`}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.qty} x Rp {item.harga.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="font-bold text-slate-700">
                    Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
              
              <div className="pt-2 flex justify-between items-center font-bold text-base text-red-900">
                <span>Total:</span>
                <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
              </div>

              {/* Form Data Pemesan */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipePesanan('Dine-in')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      tipePesanan === 'Dine-in' ? 'bg-amber-100 border-amber-600 text-amber-900' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Makan di Tempat
                  </button>
                  <button
                    onClick={() => setTipePesanan('Takeaway')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      tipePesanan === 'Takeaway' ? 'bg-amber-100 border-amber-600 text-amber-900' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Bungkus
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
                    placeholder="Nomor Meja (misal: 03)..."
                    value={nomorMeja}
                    onChange={(e) => setNomorMeja(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
                  />
                )}
              </div>

              {/* Tombol Checkout WhatsApp */}
              <button
                onClick={handleCheckoutWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 mt-2"
              >
                <span>💬 Pesan via WhatsApp</span>
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
                <h3 className="font-bold text-lg text-slate-900">{selectedItem.nama}</h3>
                <p className="text-xs text-red-700 font-bold">
                  Rp {selectedItem.harga.toLocaleString('id-ID')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Jenis Mie */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilihan Mie / Bihun:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Mie Kuning / Pipih', 'Bihun Saja', 'Mix (Mie + Bihun)'].map((option) => (
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

            {/* Pilihan Tingkat Pedas */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Tingkat Pedas Sambal:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Tanpa Sambal', 'Pedas Sedang', 'Pedas Mantap 🔥'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setPedas(level)}
                    className={`py-1.5 px-2 text-xs rounded-lg border font-medium text-center transition ${
                      pedas === level 
                        ? 'border-red-600 bg-red-50 text-red-700 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional):</label>
              <input
                type="text"
                placeholder="Misal: Tanpa seledri, kuah dipisah..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Tombol Konfirmasi */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow"
              >
                Tambahkan ke Keranjang
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}