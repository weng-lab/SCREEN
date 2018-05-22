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

export const cacheKeys = [
    'chromCounts',
    'creHist',
    'tf_list',
    'datasets',
    'rankMethodToCellTypes',
    'rankMethodToIDxToCellType',
    'ensemblToGene',
    'nineState',
    'filesList',
    'inputData',
    'geBiosampleTypes',
    'geBiosamples',
    'geneIDsToApprovedSymbol',
    'tfHistCounts',
    'creBigBeds',
    'ctmap',
    'ctsTable',
    'de_ctidmap',
    'gwas_studies',
];

export type loadablecache = ByFunction<Promisify<cache>>;
export type loadableglobalcache = ByFunction<Promisify<globalcache>>;

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
    ctmap: any;
    ctsTable: any;
    de_ctidmap: any;
    gwas_studies: any;
};

export type globalcache = {
    colors: any;
    helpKeys: { all: any };
    files: any;
    inputData: any;
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
                    cistrome: {},
                });
            }),

        creBigBeds: () => Common.creBigBeds(assembly),

        ctmap: () => Common.makeCtMap(assembly),
        ctsTable: () => Common.makeCTStable(assembly),

        de_ctidmap: assembly === 'mm10' ? () => De.getCtMap(assembly) : () => Promise.resolve(undefined),

        gwas_studies: assembly === 'hg19' ? () => Gwas.gwasStudies(assembly) : () => Promise.resolve(undefined),
    };
}

function getCache(assembly, cacheLoader: DataLoader<string, any>): loadablecache {
    return cacheKeys.reduce(
        (prev, key) => {
            prev[key] = () => cacheLoader.load(key);
            return prev;
        },
        {} as loadablecache
    );
}

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

let cacheLoaders: Record<Assembly, DataLoader<string, any>> = undefined as any;
let caches: Record<Assembly, loadablecache> = undefined as any;
let globalcache: loadableglobalcache = undefined as any;
export function prepareCache() {
    if (caches) {
        return;
    }
    try {
        cacheLoaders = {
            hg19: cacheLoader(getCacheMap('hg19')),
            mm10: cacheLoader(getCacheMap('mm10')),
        };
        const hg19 = getCache('hg19', cacheLoaders.hg19);
        const mm10 = getCache('mm10', cacheLoaders.mm10);
        caches = {
            hg19: hg19,
            mm10: mm10,
        };
        globalcache = getGlobalCacheMap();

        console.log('Cache functions loaded: ', Object.keys(caches));
    } catch (e) {
        cacheLoaders = undefined as any;
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

export const Compartments = Promise.resolve([
    'cell',
    'nucleoplasm',
    'cytosol',
    'nucleus',
    'membrane',
    'chromatin',
    'nucleolus',
]);

const chrom_lengths = require('../constants').chrom_lengths;
export function global_data(assembly): Record<string, Promise<any>> {
    const c = loadCache(assembly);
    const datasets = c.datasets;
    return {
        tfs: c.tf_list(),
        cellCompartments: Compartments,
        cellTypeInfoArr: datasets().then(d => d.globalCellTypeInfoArr),
        chromCounts: c.chromCounts(),
        chromLens: chrom_lengths[assembly],
        creHistBins: c.creHist(),
        geBiosampleTypes: c.geBiosampleTypes(),
        geBiosamples: c.geBiosamples(),
        creBigBedsByCellType: c.creBigBeds(),
        creFiles: c.filesList(),
        inputData: c.inputData(),
    };
}

let globaldata: Promisify<globalcache> = undefined as any;
export function global_data_global() {
    if (globaldata) {
        return globaldata;
    }
    globaldata = Object.keys(globalcache).reduce(
        (obj, key) => {
            obj[key] = globalcache[key]();
            return obj;
        },
        {} as Promisify<globalcache>
    );
    return globaldata;
}

prepareCache();
