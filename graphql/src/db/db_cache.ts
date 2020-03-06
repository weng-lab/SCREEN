import * as Common from './db_common';
import * as De from './db_de';
import * as Gwas from './db_gwas';
import DataLoader from 'dataloader';
import { Assembly, assaytype, ctspecificdata } from '../types';
import { getCtSpecificData } from './db_cre_table';
import { nearbyGene } from '../resolvers/credetails';
import { reduceAsKeys } from '../utils';

const assemblies: Assembly[] = ['grch38', 'mm10'];

const ccRECtspecificLoader = (assembly: Assembly) =>
    new DataLoader<string, ctspecificdata>(keys => getCtSpecificData(assembly, keys));
export const ccRECtspecificLoaders = reduceAsKeys(assemblies, ccRECtspecificLoader);
const nearbyPcGenesLoader = (assembly: Assembly) =>
    new DataLoader<string, nearbyGene[]>(keys => Common.getGenesMany(assembly, keys, 'pc'));
const nearbyAllGenesLoader = (assembly: Assembly) =>
    new DataLoader<string, nearbyGene[]>(keys => Common.getGenesMany(assembly, keys, 'all'));
export const nearbyPcGenesLoaders = reduceAsKeys(assemblies, nearbyPcGenesLoader);
export const nearbyAllGenesLoaders = reduceAsKeys(assemblies, nearbyAllGenesLoader);

async function indexFilesTab(assembly) {
    const datasets = await Common.datasets(assembly);
    const creBeds = await Common.ccreBeds(assembly);
    const ret = {
        agnostic: [] as any[],
        specific: [] as any[],
    };
    for (const [biosample, typAcc] of Object.entries(creBeds)) {
        let celltypedesc = '';
        let tissue = '';
        if ('_agnostic' != biosample) {
            celltypedesc = datasets.byCellTypeValue[biosample].name;
            tissue = datasets.byCellTypeValue[biosample].tissue;
        }
        const row = {
            celltypename: biosample,
            celltypedesc: celltypedesc,
            tissue: tissue,
            assembly: assembly,
            '7group': 'NA',
            '9state-H3K27ac': 'NA',
            '9state-H3K4me3': 'NA',
            '9state-CTCF': 'NA',
            '9state-DNase': 'NA',
        };
        for (const [typ, acc] of Object.entries(typAcc)) {
            row[typ] = acc;
        }
        if ('_agnostic' === biosample) {
            ret['agnostic'].push(row);
        } else {
            ret['specific'].push(row);
        }
    }
    return ret;
}

export type Promisify<T> = { [P in keyof T]: Promise<T[P]> };
export type ByFunction<T> = { [P in keyof T]: () => T[P] };

export type loadablecache = ByFunction<Promisify<cache>>;
export type loadableglobalcache = ByFunction<Promisify<globalcache>>;

export type Biosample = {
    name: string;
    celltypevalue: string;
    count: number;
    is_ninestate: boolean;
    is_intersection_peak: boolean;
    is_intersection_cistrome: boolean;
    is_rnaseq: boolean;
};
export type cache = {
    chromCounts: Record<string, number>;
    creHist: any;
    tf_list: any;
    datasets: { globalCellTypeInfoArr: { name: string; value: string }[]; byCellTypeValue: Record<string, string> };
    rankMethodToCellTypes: any;
    rankMethodToIDxToCellType: any;
    ensemblToGene: Record<
        string,
        {
            assembly: Assembly;
            approved_symbol: string;
            ensemblid: string;
            ensemblid_ver: string;
            coords: {
                chrom: string;
                start: number;
                end: number;
                strand: string;
            };
        }
    >;
    nineState: any;
    filesList: any;
    inputData: any;
    geBiosampleTypes: string[];
    geBiosamples: any;
    geneIDsToApprovedSymbol: Record<string, any>;
    tfHistCounts: any;
    ccreBeds: any;
    ctmap: Record<assaytype, Record<Common.celltype, Common.ctindex>>;
    ctsTable: any;
    biosamples: Record<string, Biosample>;
    de_ctidmap: any;
    gwas_studies: Gwas.DBGwasStudy[];
};

function getCacheMap(assembly): loadablecache {
    return {
        chromCounts: () => Common.chromCounts(assembly),
        creHist: () => Common.creHist(assembly),

        tf_list: () => Common.tfHistoneDnaseList(assembly, 'encode'),

        datasets: () => Common.datasets(assembly),

        rankMethodToCellTypes: () => Common.rankMethodToCellTypes(assembly),
        rankMethodToIDxToCellType: () => Common.rankMethodToIDxToCellType(assembly),

        ensemblToGene: () => Common.genemap(assembly),

        nineState: () => Common.loadNineStateGenomeBrowser(assembly),
        filesList: () => indexFilesTab(assembly),
        inputData: () => Common.inputData(assembly),

        geBiosampleTypes: () => Common.geBiosampleTypes(assembly),
        geBiosamples: () => Common.geBiosamples(assembly),

        geneIDsToApprovedSymbol: () => Common.geneIDsToApprovedSymbol(assembly),

        tfHistCounts: () =>
            new Promise(async resolve => {
                resolve({
                    peak: await Common.tfHistCounts(assembly, 'peak'),
                    cistrome: await Common.tfHistCounts(assembly, 'cistrome'),
                });
            }),

        ccreBeds: () => Common.ccreBeds(assembly),

        ctmap: () => Common.makeCtMap(assembly),
        ctsTable: () => Common.makeCTStable(assembly),

        biosamples: () => Common.makeBiosamplesMap(assembly),

        de_ctidmap: assembly === 'mm10' ? () => De.getCtMap(assembly) : () => Promise.resolve(undefined),

        gwas_studies: assembly === 'grch38' ? () => Gwas.gwasStudies(assembly) : () => Promise.resolve([]),
    };
}

export type globalcache = {
    colors: any;
    helpKeys: { all: any };
    files: any;
    inputData: any;
};

function getGlobalCacheMap(): loadableglobalcache {
    return {
        colors: () => require('./colors'),
        helpKeys: () =>
            new Promise(async resolve => {
                resolve({
                    all: await Common.getHelpKeys(),
                });
            }),
        files: () =>
            new Promise(async resolve => {
                const GRCh38cache = loadCache('grch38');
                const mm10cache = loadCache('mm10');
                const GRCh38filelist = await GRCh38cache.filesList();
                const mm10filelist = await mm10cache.filesList();
                resolve({
                    agnostic: [].concat(GRCh38filelist.agnostic).concat(mm10filelist.agnostic),
                    specific: [].concat(GRCh38filelist.specific).concat(mm10filelist.specific),
                });
            }),
        inputData: () =>
            new Promise(async resolve => {
                const GRCh38cache = loadCache('grch38');
                const mm10cache = loadCache('mm10');
                const GRCh38inputData = await GRCh38cache.inputData();
                const mm10inputData = await mm10cache.inputData();
                resolve([].concat(GRCh38inputData).concat(mm10inputData));
            }),
    };
}

function getCache<C, R extends ByFunction<Promisify<C>> = ByFunction<Promisify<C>>>(
    cacheMap: R
): [ByFunction<Promisify<C>>, DataLoader<keyof C, C[keyof C]>] {
    const loader = new DataLoader<keyof C, C[keyof C]>(keys => Promise.all(keys.map(key => cacheMap[key]()) as any));
    const map = Object.keys(cacheMap).reduce((prev, key) => {
        prev[key] = () => loader.load(key as any); // We know this key is `keyof R`
        return prev;
    }, {} as ByFunction<Promisify<C>>);
    return [map, loader];
}

let caches: Record<Assembly, [loadablecache, DataLoader<keyof cache, any>]> = undefined as any;
let globalcache: [
    loadableglobalcache,
    DataLoader<keyof globalcache, globalcache[keyof globalcache]>
] = undefined as any;
export function prepareCache() {
    if (caches) {
        return;
    }
    try {
        const GRCh38map = getCacheMap('grch38');
        const mm10map = getCacheMap('mm10');
        const grch38 = getCache<cache>(GRCh38map);
        const mm10 = getCache<cache>(mm10map);
        caches = {
            grch38,
            mm10,
        };
        const globalmap = getGlobalCacheMap();
        const global = getCache<globalcache>(globalmap);
        globalcache = global;

        console.log('Cache functions loaded: ', Object.keys(caches));
    } catch (e) {
        caches = undefined as any;
        globalcache = undefined as any;
        console.error('Error when loading cache.', e);
        throw new Error(e);
    }
}

export function loadCache(assembly: Assembly): loadablecache {
    return caches[assembly.toLowerCase()][0];
}

export function loadGlobalCache(): loadableglobalcache {
    return globalcache[0];
}

export const Compartments = Promise.resolve([
    'cell',
    'nucleoplasm',
    'cytosol',
    'nucleus',
    'membrane',
    'chromatin',
    'nucleolus',
]);

prepareCache();
