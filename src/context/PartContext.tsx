import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import type { SelectedParts, Motherboard, CPU, RAM, GPU, Cooler, Storage, Case, PSU, Monitor, Keyboard, Mouse } from '../types/parts';
import { loadData } from '../utils/loader';

export interface AppState {
    selectedParts: SelectedParts;
    totalPrice: number;
    allData: any; // Tüm yüklenen verileri tutacak
    isLoading: boolean;
}

type PartCategory = keyof SelectedParts;

type Action =
    | { type: 'SELECT_PART'; payload: { category: PartCategory; part: any } }
    | { type: 'SET_DATA'; payload: any }
    | { type: 'SET_LOADING'; payload: boolean };

const calculateTotalPrice = (parts: SelectedParts): number => {
    let total = 0;
    
    Object.values(parts).forEach(part => {
        if (!part) return;

        const processItem = (item: any) => {
            if (item.stok && item.stok.durum === "out_of_stock") {
                return; 
            }
            if (item.fiyat_try !== undefined) {
                total += item.fiyat_try;
            }
        };

        if (Array.isArray(part)) {
            part.forEach(processItem);
        } else {
            processItem(part);
        }
    });
    
    return total;
};


const initialState: AppState = {
    selectedParts: {
        cpu: null,
        motherboard: null,
        ram: null,
        gpu: null,
        cooler: null,
        storage: null,
        case: null,
        psu: null,
        monitor: null,
        keyboard: null,
        mouse: null,
    },
    totalPrice: 0,
    allData: null,
    isLoading: true,
};


const partReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, allData: action.payload, isLoading: false };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SELECT_PART': {
            const { category, part } = action.payload;
            
            let newSelectedParts: SelectedParts = { ...state.selectedParts, [category]: part };

            if (category === 'motherboard') { 
                const newMobo = part as Motherboard | null;
                
                
                if (state.selectedParts.cpu && (!newMobo || state.selectedParts.cpu.soket !== newMobo.soket)) {
                    newSelectedParts.cpu = null;
                }
                
                
                if (state.selectedParts.ram) {
                    const compatibleRam = (state.selectedParts.ram as RAM[]).filter(r => 
                        newMobo && r.tip === newMobo.bellek.tip
                    );
                    if (compatibleRam.length !== (state.selectedParts.ram as RAM[]).length) {
                        newSelectedParts.ram = compatibleRam.length > 0 ? compatibleRam : null;
                    }
                }
                
                
                if (state.selectedParts.cooler && (!newMobo || !state.selectedParts.cooler.desteklenen_soketler.includes(newMobo.soket))) {
                    newSelectedParts.cooler = null;
                }
                
                
                if (state.selectedParts.case && (!newMobo || !state.selectedParts.case.mobo_destek.includes(newMobo.form_factor))) {
                    newSelectedParts.case = null;
                }

            } else if (category === 'cpu') { 
                const newCpu = part as CPU | null;
                const currentMobo = state.selectedParts.motherboard;
                
                if (currentMobo && newCpu && newCpu.soket !== currentMobo.soket) {
                    newSelectedParts.motherboard = null;
                    newSelectedParts.ram = null;
                    newSelectedParts.cooler = null;
                }
                
                if (state.selectedParts.cooler && newCpu && !state.selectedParts.cooler.desteklenen_soketler.includes(newCpu.soket)) {
                    newSelectedParts.cooler = null;
                }
            } 
            
            if (category === 'case' && state.selectedParts.cooler) {
                const newCase = part as Case | null;
                if (newCase && newCase.cpu_sogutucu_yukseklik_max_mm < state.selectedParts.cooler.yukseklik_mm!) {
                    newSelectedParts.cooler = null; 
                }
            }
            
            const newPrice = calculateTotalPrice(newSelectedParts);
            localStorage.setItem('selectedParts', JSON.stringify(newSelectedParts));
            
            return { 
                ...state, 
                selectedParts: newSelectedParts, 
                totalPrice: newPrice 
            };
        }
        default: 
            return state; 
    }
};

const PartContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const PartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(partReducer, initialState);

    React.useEffect(() => {
        const setupData = async () => {
            try {
                const data = await loadData();
                dispatch({ type: 'SET_DATA', payload: data });
            } catch (error) {
                console.error("Veri yüklenirken hata oluştu:", error);
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };
        setupData();
    }, []);

    return (
        <PartContext.Provider value={{ state, dispatch }}>
            {state && state.isLoading ? (
                 <div className="flex justify-center items-center h-screen text-2xl">Veriler Yükleniyor... Lütfen bekleyin.</div>
            ) : children}
        </PartContext.Provider>
    );
};

export const usePartContext = () => {
    const context = useContext(PartContext);
    if (context === undefined) {
        throw new Error('usePartContext must be used within a PartProvider');
    }
    return context;
};