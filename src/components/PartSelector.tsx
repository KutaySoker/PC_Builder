import React, { useState, useMemo, useEffect } from 'react';
import { usePartContext } from '../context/PartContext';
import type { SelectedParts, Motherboard, CPU, RAM, GPU, Cooler, Storage, Case, PSU, Monitor, Keyboard, Mouse } from '../types/parts';

interface PartCategoryConfig<T> {
    dataKey: keyof Omit<AppState['allData'], 'anakartlar'> | 'anakartlar'; 
    title: string;
    isMultiSelect: boolean;
    renderPart: (part: T) => React.ReactNode;
    getCompatibilityData: (state: SelectedParts) => any;
}

const categoryConfigs: Record<keyof SelectedParts, PartCategoryConfig<any>> = {
    motherboard: {
        dataKey: 'anakartlar',
        title: '1. Anakart Seçimi',
        isMultiSelect: false,
        renderPart: (part: Motherboard) => (<> {part.marka} {part.model} - Soket: {part.soket} - Form: {part.form_factor} - Fiyat: {part.fiyat_try} TL</>),
        getCompatibilityData: (state) => ({}),
    },
    cpu: {
        dataKey: 'islemciler',
        title: '2. İşlemci (CPU) Seçimi',
        isMultiSelect: false,
        renderPart: (part: CPU) => (<> {part.marka} {part.model} - Soket: {part.soket} - TDP: {part.tdp_w}W - RAM: {part.bellek_destek.tip}</>),
        getCompatibilityData: (state) => ({ anakartSocket: state.motherboard?.soket }),
    },
    ram: {
        dataKey: 'RAMler',
        title: '3. RAM Seçimi (Çoklu Seçilebilir)',
        isMultiSelect: true, 
        renderPart: (part: RAM) => (<> {part.marka} {part.model} - {part.tip} {part.hiz_mhz}MHz - {part.kapasite_gb}GB</>),
        getCompatibilityData: (state) => ({ anakartRamTipi: state.motherboard?.bellek.tip }),
    },
    gpu: {
        dataKey: 'GPUlar',
        title: '4. Ekran Kartı (GPU) Seçimi',
        isMultiSelect: false,
        renderPart: (part: GPU) => (<> {part.marka} {part.model} - Önerilen PSU: {part.guc.onerilen_psu_w}W</>),
        getCompatibilityData: (state) => ({}),
    },
    psu: {
        dataKey: 'PSU',
        title: '5. Güç Kaynağı (PSU) Seçimi',
        isMultiSelect: false,
        renderPart: (part: PSU) => (<> {part.marka} {part.model} - {part.guc_w}W</>),
        getCompatibilityData: (state) => ({}),
    },
    case: { // Kasa -> case
        dataKey: 'Case',
        title: '6. Kasa Seçimi',
        isMultiSelect: false,
        renderPart: (part: Case) => (<> {part.marka} {part.model} - Desteklenen MOBO: {part.mobo_destek.join(', ')}</>),
        getCompatibilityData: (state) => ({ anakartFormFactor: state.motherboard?.form_factor }),
    },
    storage: { // Depolama -> storage
        dataKey: 'Storage',
        title: '7. Depolama Seçimi (Çoklu Seçilebilir)',
        isMultiSelect: true,
        renderPart: (part: Storage) => (<> {part.marka} {part.model} - {part.arayuz.tip} - {part.form_factor} - {part.kapasite_gb}GB</>),
        getCompatibilityData: (state) => ({}),
    },
    monitor: {
        dataKey: 'Monitor',
        title: '8. Monitör Seçimi',
        isMultiSelect: false,
        renderPart: (part: Monitor) => (<> {part.marka} {part.model} - Fiyat: {part.fiyat_try} TL</>),
        getCompatibilityData: (state) => ({}),
    },
    keyboard: { // Klavye -> keyboard
        dataKey: 'Keyboard',
        title: '9. Klavye Seçimi',
        isMultiSelect: false,
        renderPart: (part: Keyboard) => (<> {part.marka} {part.model}</>),
        getCompatibilityData: (state) => ({}),
    },
    mouse: { // Fare -> mouse
        dataKey: 'Mouse',
        title: '10. Fare Seçimi',
        isMultiSelect: false,
        renderPart: (part: Mouse) => (<> {part.marka} {part.model}</>),
        getCompatibilityData: (state) => ({}),
    },
    cooler: { // cpuSogutucu -> cooler
        dataKey: 'Cooler',
        title: '11. İşlemci Soğutucu Seçimi',
        isMultiSelect: false,
        renderPart: (part: Cooler) => (<> {part.marka} {part.model} - Destek: {part.desteklenen_soketler.join(', ')}</>),
        getCompatibilityData: (state) => ({ cpuSoket: state.cpu?.soket }),
    },
};

interface PartSelectorProps {
    category: keyof SelectedParts;
}

const PartSelector: React.FC<PartSelectorProps> = ({ category }) => {
    const { state, dispatch } = usePartContext();
    const [searchTerm, setSearchTerm] = useState(''); // Arama State'i eklendi
    
    const config = categoryConfigs[category];
    if (!config || !state.allData) return null; 

    const allAvailableParts: Array<any> = state.allData[config.dataKey] || [];
    const currentSelection = state.selectedParts[category];

    // Seçili ID'leri başlangıçta ayarla
    const [selectedIds, setSelectedIds] = useState<string[]>([]); 
    useEffect(() => {
        if (config.isMultiSelect && Array.isArray(currentSelection)) {
            setSelectedIds(currentSelection.map(p => p.id));
        } else if (!config.isMultiSelect && currentSelection) {
            setSelectedIds([currentSelection.id]);
        } else {
            setSelectedIds([]);
        }
    }, [category, currentSelection, config.isMultiSelect]);


    // --- UYUMLULUK VE FİLTRELEME ---
    const filteredAndCompatibleParts = useMemo(() => {
        const requiredData = config.getCompatibilityData(state.selectedParts);
        
        // 1. Stok Filtresi (Kural 3.10)
        let parts = allAvailableParts.filter((part: any) => part.stok.durum === "in_stock");

        // *** YENİ: Arama/Filtreleme Uygulaması ***
        if (searchTerm.trim() !== '') {
            const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
            parts = parts.filter((part: any) => 
                part.marka.toLowerCase().includes(lowerCaseSearchTerm) ||
                part.model.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        parts = parts.filter((part: any) => {
            const isCoreComponent = !['motherboard', 'keyboard', 'mouse', 'monitor', 'storage'].includes(category);
            if (isCoreComponent && !state.selectedParts.motherboard) return false; 

            if (state.selectedParts.motherboard) {
                const mobo = state.selectedParts.motherboard as Motherboard;
                
                if (category === 'cpu') {
                    const cpuPart = part as CPU;
                    const socketMatch = cpuPart.soket === mobo.soket;
                    const generationMatch = mobo.cpu_uyumluluk.nesiller.includes(cpuPart.nesil);
                    const vendorMatch = mobo.cpu_uyumluluk.vendor === "Intel" ? cpuPart.marka.startsWith("Intel") : cpuPart.marka.startsWith("AMD");
                    
                    if (!socketMatch || !generationMatch || !vendorMatch) return false;
                }
                
                if (category === 'ram') {
                    const ramPart = part as RAM;
                    if (mobo.bellek.tip && ramPart.tip !== mobo.bellek.tip) return false;
                }
                
                if (category === 'case') {
                    const casePart = part as Case;
                    if (!casePart.mobo_destek.includes(mobo.form_factor)) return false;
                }

                if (category === 'cooler') {
                    const coolerPart = part as Cooler;
                    if (!coolerPart.desteklenen_soketler.includes(mobo.soket)) return false;
                }
            }

            if (state.selectedParts.cpu) {
                const cpu = state.selectedParts.cpu as CPU;
                
                if (category === 'cooler' && !part.desteklenen_soketler.includes(cpu.soket)) return false;
                if (category === 'cooler' && cpu.tdp_w > part.max_tdp_w) return false;
            }
            
            if (category === 'psu' && state.selectedParts.gpu) {
                 const gpu = state.selectedParts.gpu as GPU;
                 const requiredWattage = (state.selectedParts.cpu?.tdp_w || 150) + gpu.guc.tgp_w + 150; 
                 if (part.guc_w < requiredWattage) return false;
            }
            
            if (category === 'case' && state.selectedParts.gpu) {
                const gpu = state.selectedParts.gpu as GPU;
                if (gpu.boyut.uzunluk_mm > part.gpu_uzunluk_max_mm) return false; 
            }
            return true;
        });
        
        return parts;
    }, [allAvailableParts, state.selectedParts, config, category, searchTerm]);

    const handlePartSelect = (part: any) => {
        if (config.isMultiSelect) {
            const currentArray = currentSelection as any[] || [];
            const isCurrentlySelected = selectedIds.includes(part.id);
            
            let newSelectedPartsArray;
            
            if (isCurrentlySelected) {
                newSelectedPartsArray = currentArray.filter(p => p.id !== part.id);
            } else {
                newSelectedPartsArray = [...currentArray, part];
            }
            
            dispatch({ type: 'SELECT_PART', payload: { category, part: newSelectedPartsArray } });

        } else {
            if (currentSelection && currentSelection.id === part.id) {
                dispatch({ type: 'SELECT_PART', payload: { category, part: null } });
            } else {
                dispatch({ type: 'SELECT_PART', payload: { category, part } });
            }
        }
    };
    
    const isPartSelected = (part: any) => {
        if (config.isMultiSelect) {
            return selectedIds.includes(part.id);
        }
        return currentSelection && currentSelection.id === part.id;
    };
    
    const isStepSelected = config.isMultiSelect ? (currentSelection as any[])?.length > 0 : !!currentSelection;

    return (
        <div className="p-4 border rounded-lg bg-white shadow-md">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h3 className="font-bold text-lg text-gray-700">{config.title}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isStepSelected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isStepSelected ? 'Seçili' : 'Bekleniyor'}
                </span>
            </div>

            
            <div className="mb-3 p-2 bg-gray-50 rounded border text-sm">
                <p className='font-semibold mb-1'>Filtreleme (Marka/Model Arama):</p>
                <input 
                    type="text" 
                    placeholder="Marka veya Model ara..." 
                    className="w-full p-1 border rounded text-xs"
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredAndCompatibleParts.length === 0 ? (
                    <p className="text-red-500 text-sm p-2 bg-red-50 rounded">
                        {state.selectedParts.motherboard 
                            ? "Bu kategoride uyumlu veya stokta parça bulunamadı." 
                            : "Bu bileşeni seçmek için lütfen önce Anakart seçiniz."
                        }
                    </p>
                ) : (
                    filteredAndCompatibleParts.map((part: any) => {
                        const selected = isPartSelected(part);
                        
                        const isOutOfStock = part.stok.durum === "out_of_stock";
                        
                        const isCoreComponent = !['motherboard', 'keyboard', 'mouse', 'monitor', 'storage'].includes(category);
                        const isDependencyMissing = isCoreComponent && !state.selectedParts.motherboard;

                        const isDisabled = isOutOfStock || isDependencyMissing;
                        
                        return (
                            <button
                                key={part.id}
                                onClick={() => !isDisabled && handlePartSelect(part)}
                                disabled={isDisabled}
                                title={
                                    isOutOfStock ? "Stokta Yok" : 
                                    isDependencyMissing ? "Bu adım için önce Anakart seçmelisiniz." : 
                                    selected ? "Seçimi Kaldır" : "Bu parçayı seç"
                                }
                                className={`w-full text-left p-2 border rounded transition duration-150 text-sm 
                                    ${selected 
                                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400 font-semibold' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }
                                    ${isDisabled 
                                        ? 'opacity-50 cursor-not-allowed bg-red-50 border-red-200'
                                        : 'hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{config.renderPart(part)}</span>
                                    {isOutOfStock && <span className="text-xs text-red-600 font-bold">STOKTA YOK</span>}
                                    {isDependencyMissing && category !== 'motherboard' && <span className="text-xs text-orange-600 font-bold">ÖNCE ANAKART!</span>}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PartSelector;