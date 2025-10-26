import type { Anakart, CPU, RAM, GPU, Cooler, Storage, Case, PSU, Monitor, Keyboard, Mouse } from "../types/parts";

interface DataSet {
    anakartlar: Anakart[]
    islemciler: CPU[];
    RAMler: RAM[];
    GPUlar: GPU[];
    Cooler: Cooler[];
    Storage: Storage[];
    Case: Case[];
    PSU: PSU[];
    Monitor: Monitor[];
    Keyboard: Keyboard[];
    Mouse: Mouse[]
}

export const loadData = async (): Promise<DataSet> => {
    const anakartPromise = fetch('/data/anakart.json').then(res => res.json()) as Promise<Anakart[]>
    const islemciPromise = fetch('/data/islemci.json').then(res => res.json()) as Promise<CPU[]>
    const RAMPromise = fetch('/data/ram.json').then(res => res.json()) as Promise<RAM[]>
    const GPUPromise = fetch('/data/ekran_karti.json').then(res => res.json()) as Promise<GPU[]>
    const CoolerPromise = fetch('/data/islemci_sogutucu.json').then(res => res.json()) as Promise<Cooler[]>
    const StoragePromise = fetch('/data/depolama.json').then(res => res.json()) as Promise<Storage[]>
    const CasePromise = fetch('/data/kasa.json').then(res => res.json()) as Promise<Case[]>
    const PSUPromise = fetch('/data/psu.json').then(res => res.json()) as Promise<PSU[]>
    const MonitorPromise = fetch('/data/monitor.json').then(res => res.json()) as Promise<Monitor[]>
    const KeyboardPromise = fetch('/data/klavye.json').then(res => res.json()) as Promise<Keyboard[]>
    const MousePromise = fetch('/data/fare.json').then(res => res.json()) as Promise<Mouse[]>


    const [anakartlar, islemciler, RAMler,GPUlar,Cooler,Storage,Case,PSU,Monitor,Keyboard,Mouse] = await Promise.all(
        [
            anakartPromise,
            islemciPromise,
            RAMPromise,
            GPUPromise,
            CoolerPromise,
            StoragePromise,
            CasePromise,
            PSUPromise,
            MonitorPromise,
            KeyboardPromise,
            MousePromise,
        ]
    )
    console.log("Tüm veriler başarıyla yüklendi.");

    return {anakartlar, islemciler, RAMler,GPUlar,Cooler,Storage,Case,PSU,Monitor,Keyboard,Mouse}
}