import * as Path from 'path';
import * as Common from './db_common';
import * as De from './db_de';
import * as Gwas from './db_gwas';
import { GwasCellType } from '../schema/GwasResponse';
import * as DataLoader from 'dataloader';
import { TypeMap } from 'mime';

const Raven = require('raven');

export type Assembly = 'hg19' | 'mm10';
const assemblies: Assembly[] = ['hg19', 'mm10'];

const cacheLoader = (cacheMap: loadablecache) =>
    new DataLoader<keyof cache, any>(keys => Promise.all(keys.map(key => cacheMap[key]())));

const globalcacheLoader = (cacheMap: loadableglobalcache) =>
    new DataLoader<keyof globalcache, any>(keys => Promise.all(keys.map(key => cacheMap[key]())));

async function indexFilesTab(assembly) {
    const datasets = await Common.datasets(assembly);
    const creBeds = await Common.creBeds(assembly);
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
            '5group': 'NA',
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
    datasets: any;
    rankMethodToCellTypes: any;
    rankMethodToIDxToCellType: any;
    ensemblToGene: Record<
        string,
        {
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
    creBigBeds: any;
    ctmap: Record<string, any>;
    ctsTable: any;
    biosamples: Record<string, Biosample>;
    de_ctidmap: any;
    gwas_studies: any;
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

        creBigBeds: () => Common.creBigBeds(assembly),

        ctmap: () => Common.makeCtMap(assembly),
        ctsTable: () => Common.makeCTStable(assembly),

        biosamples: () => Common.makeBiosamplesMap(assembly),

        de_ctidmap: assembly === 'mm10' ? () => De.getCtMap(assembly) : () => Promise.resolve(undefined),

        gwas_studies: assembly === 'hg19' ? () => Gwas.gwasStudies(assembly) : () => Promise.resolve(undefined),
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
                const hg19cache = loadCache('hg19');
                const mm10cache = loadCache('mm10');
                const hg19filelist = await hg19cache.filesList();
                const mm10filelist = await mm10cache.filesList();
                resolve({
                    agnostic: [].concat(hg19filelist.agnostic).concat(mm10filelist.agnostic),
                    specific: [].concat(hg19filelist.specific).concat(mm10filelist.specific),
                });
            }),
        inputData: () =>
            new Promise(async resolve => {
                const hg19cache = loadCache('hg19');
                const mm10cache = loadCache('mm10');
                const hg19inputData = await hg19cache.inputData();
                const mm10inputData = await mm10cache.inputData();
                resolve([].concat(hg19inputData).concat(mm10inputData));
            }),
    };
}

function getCache<C>(
    cacheKeys: Array<keyof C>,
    cacheLoader: DataLoader<keyof C, any>
): ByFunction<Promisify<Record<keyof C, any>>> {
    return cacheKeys.reduce(
        (prev, key) => {
            prev[key] = () => cacheLoader.load(key);
            return prev;
        },
        {} as ByFunction<Promisify<Record<keyof C, any>>>
    );
}

let caches: Record<Assembly, loadablecache> = undefined as any;
let globalcache: loadableglobalcache = undefined as any;
export function prepareCache() {
    if (caches) {
        return;
    }
    try {
        const hg19map = getCacheMap('hg19');
        const mm10map = getCacheMap('mm10');
        const hg19 = getCache<loadablecache>(Object.keys(hg19map) as (keyof cache)[], cacheLoader(hg19map));
        const mm10 = getCache<loadablecache>(Object.keys(mm10map) as (keyof cache)[], cacheLoader(mm10map));
        caches = {
            hg19: hg19,
            mm10: mm10,
        };
        const globalmap = getGlobalCacheMap();
        globalcache = getCache<loadableglobalcache>(
            Object.keys(globalmap) as (keyof globalcache)[],
            globalcacheLoader(globalmap)
        );

        console.log('Cache functions loaded: ', Object.keys(caches));
    } catch (e) {
        caches = undefined as any;
        globalcache = undefined as any;
        console.error('Error when loading cache.', e);
        Raven.captureException(e);
        throw new Error(e);
    }
}

export function loadCache(assembly: Assembly): loadablecache {
    return caches[assembly];
}

export function loadGlobalCache(): loadableglobalcache {
    return globalcache;
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
