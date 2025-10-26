import React from 'react';
import { usePartContext } from './context/PartContext';
import type { SelectedParts } from './types/parts'; // Tip importunu güncelledik
import PartSelector from './components/PartSelector'; // Yeni bileşeni import et

function App() {
  // usePartContext'ten gelen context'i alırken, state'in varlığını kontrol etmeliyiz.
  const context = usePartContext();
  
  // Eğer context (state) yoksa veya henüz yüklenmemişse (isLoading true ise)
  if (!context || !context.state || context.state.isLoading) {
    // PartProvider'ın kendi yükleme ekranı olmasına rağmen, App'in de bir bekleme ekranı olabilir.
    // Ancak ana kontrol PartProvider'da olduğu için, burada sadece context'in varlığını kontrol etmek yeterlidir.
    return <div className="flex justify-center items-center h-screen text-2xl">Sistem Başlatılıyor...</div>;
  }
  
  // Eğer context ve state varsa, normal akışa devam et
  const { state } = context; 
  
  // Seçim Sırası
   const selectionOrder: (keyof SelectedParts)[] = [
    'motherboard', // ESKİSİ: 'anakart' idi
    'cpu', 
    'ram', 
    'gpu', 
    'psu', 
    'case', // ESKİSİ: 'kasa' idi
    'storage', // ESKİSİ: 'depolama' idi
    'monitor', 
    'keyboard', // ESKİSİ: 'klavye' idi
    'mouse', // ESKİSİ: 'fare' idi
    'cooler' // ESKİSİ: 'cpuSogutucu' idi
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">PC Toplama Sihirbazı</h1>
      </header>

      <main className="flex flex-col lg:flex-row gap-8">
        
        {/* Sol/Orta Kısım: Bileşen Seçim Alanı */}
        <section className="flex-grow lg:w-3/4">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Adım Adım Bileşen Seçimi</h2>
            
            <div className="space-y-6">
              {selectionOrder.map((categoryKey) => {
                // Sadece Anakart seçilene kadar diğerlerini atla (Opsiyonel, PartSelector'da da kontrol var)
                if (categoryKey !== 'anakart' && !state.selectedParts.anakart && categoryKey !== 'klavye' && categoryKey !== 'fare' && categoryKey !== 'monitor') {
                    // İlk zorunlu bileşenler (Anakart) seçilene kadar diğer zorunlu adımları atla
                    // Klavye/Fare/Monitör gibi bağımsızları göstermeye devam edebiliriz.
                }
                
                return (
                  <PartSelector 
                    key={categoryKey} 
                    category={categoryKey} 
                  />
                );
              })}
            </div>
            
          </div>
        </section>
        
        {/* Sağ Panel: Seçilenler ve Toplam Fiyat (App.tsx'teki özet kısmı olduğu gibi kalabilir) */}
        <aside className="lg:w-1/4">
          {/* ... Özet Paneli Kodu Buraya Gelecek ... */}
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg sticky top-4">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-blue-400">Özetiniz</h2>
            
            <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-2">
              {Object.entries(state.selectedParts).map(([key, part]) => {
                if (part) {
                  let name = key.charAt(0).toUpperCase() + key.slice(1);
                  
                  if (key === 'ram') name = 'RAM (Toplam)';
                  if (key === 'depolama') name = 'Depolama (Toplam)';
                  
                  const partName = Array.isArray(part) ? 
                                    (part.length > 0 ? part.map(p => p.model || p.marka).join(', ') : 'Boş Liste') : 
                                    part.model || part.marka || 'Bilinmeyen Parça';
                  const price = Array.isArray(part) ? part.reduce((sum, item) => sum + (item.fiyat || 0), 0) : part.fiyat;
                  
                  return (
                    <div key={key} className="flex justify-between text-sm border-b border-blue-400 py-1">
                      <span className="font-medium">{name}:</span>
                      <span>{partName}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="pt-4 border-t border-blue-400 flex justify-between font-bold text-xl">
              <span>Toplam Fiyat:</span>
              <span>{state.totalPrice.toLocaleString('tr-TR')} TL</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;