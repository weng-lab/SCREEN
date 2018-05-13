import * as Path from 'path';
import * as Common from './db_common';
import * as De from './db_de';

const Raven = require('raven');

function indexFilesTab(datasets, rows, assembly) {
    const ret: any = {
        agnostic: [],
        specific: [],
    };
    for (const [biosample, typAcc] of Object.entries(rows)) {
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

export type cache = {
    chromCounts: Record<string, number>;
    creHist: any;
    tf_list: any;
    datasets: any;
    rankMethodToCellTypes: any;
    rankMethodToIDxToCellType: any;
    biosampleTypes: undefined;
    assaymap: undefined;
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
    moreTracks: undefined;
    geBiosampleTypes: string[];
    geBiosamples: any;
    geneIDsToApprovedSymbol: Record<string, any>;
    tfHistCounts: any;
    creBigBeds: any;
    ctmap: any;
    ctsTable: any;
    de_ctidmap: any;
};

async function load(assembly) {
    const chromCounts = await Common.chromCounts(assembly);
    const creHist = await Common.creHist(assembly);
    const tf_list = await Common.tfHistoneDnaseList(assembly, 'encode');
    const datasets = await Common.datasets(assembly);
    const rankMethodToCellTypes = await Common.rankMethodToCellTypes(assembly);
    const rankMethodToIDxToCellType = await Common.rankMethodToIDxToCellType(assembly);
    const ensemblToGene = await Common.genemap(assembly);
    const nineState = await Common.loadNineStateGenomeBrowser(assembly);
    const creBeds = await Common.creBeds(assembly);
    const filesList = indexFilesTab(datasets, creBeds, assembly);
    const inputData = await Common.inputData(assembly);
    const geBiosampleTypes = await Common.geBiosampleTypes(assembly);
    const geBiosamples = await Common.geBiosamples(assembly);
    const geneIDsToApprovedSymbol = await Common.geneIDsToApprovedSymbol(assembly);
    const peak_tfHistCounts = await Common.tfHistCounts(assembly, 'peak');
    const tfHistCounts = {
        peak: peak_tfHistCounts,
        cistrome: {},
    };
    const creBigBeds = await Common.creBigBeds(assembly);
    const ctmap = await Common.makeCtMap(assembly);
    const ctsTable = await Common.makeCTStable(assembly);

    let de_ctidmap;
    if (assembly === 'mm10') {
        de_ctidmap = await De.getCtMap(assembly);
    }

    const cache: cache = {
        chromCounts: chromCounts,
        creHist: creHist,

        tf_list: tf_list,

        datasets: datasets,

        rankMethodToCellTypes: rankMethodToCellTypes,
        rankMethodToIDxToCellType: rankMethodToIDxToCellType,

        biosampleTypes: undefined,
        assaymap: undefined,
        ensemblToGene: ensemblToGene,

        nineState: nineState,
        filesList: filesList,
        inputData: inputData,

        moreTracks: undefined,

        geBiosampleTypes: geBiosampleTypes,
        geBiosamples: geBiosamples,

        geneIDsToApprovedSymbol: geneIDsToApprovedSymbol,

        tfHistCounts: tfHistCounts,

        creBigBeds: creBigBeds,

        ctmap: ctmap,
        ctsTable: ctsTable,

        de_ctidmap: de_ctidmap,
    };
    return cache;
}

async function loadGlobal(hg19, mm10) {
    const colors = require('./colors');
    const helpKeys = await Common.getHelpKeys();
    const files = {
        agnostic: [].concat(hg19.filesList.agnostic).concat(mm10.filesList.agnostic),
        specific: [].concat(hg19.filesList.specific).concat(mm10.filesList.specific),
    };
    const inputData = [].concat(hg19.inputData).concat(mm10.inputData);

    const global_cache = {
        colors: colors,
        helpKeys: { all: helpKeys },
        files: files,
        inputData: inputData,
    };
    return global_cache;
}

let caches: any = undefined;
let globalcache: any = undefined;
export async function loadCaches() {
    if (caches) {
        return;
    }
    try {
        const hg19 = load('hg19');
        const mm10 = load('mm10');
        caches = {
            hg19: hg19,
            mm10: mm10,
        };
        const hg19cache = await hg19;
        const mm10cache = await mm10;
        globalcache = await loadGlobal(hg19cache, mm10cache);

        console.log('Cache loaded: ', Object.keys(caches));
    } catch (e) {
        caches = undefined;
        globalcache = undefined;
        console.error('Error when loading cache.', e);
        Raven.captureException(e);
        throw new Error(e);
    }
}

export async function cache(assembly): Promise<cache> {
    await loadCaches();
    return caches[assembly];
}

export const Compartments = ['cell', 'nucleoplasm', 'cytosol', 'nucleus', 'membrane', 'chromatin', 'nucleolus'];

const chrom_lengths = require('../constants').chrom_lengths;
export async function global_data(assembly) {
    const c = await cache(assembly);
    const datasets = c.datasets;
    return {
        tfs: c.tf_list,
        cellCompartments: Compartments,
        cellTypeInfoArr: datasets.globalCellTypeInfoArr,
        chromCounts: c.chromCounts,
        chromLens: chrom_lengths[assembly],
        creHistBins: c.creHist,
        geBiosampleTypes: c.geBiosampleTypes,
        geBiosamples: c.geBiosamples,
        creBigBedsByCellType: c.creBigBeds,
        creFiles: c.filesList,
        inputData: c.inputData,
    };
}

export async function global_data_global() {
    await loadCaches();
    return { ...globalcache };
}

loadCaches().catch(e => {
    console.log('Cache load error on start.', e);
});
