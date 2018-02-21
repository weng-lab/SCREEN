import * as Path from 'path';
import * as Common from './db_common';

function indexFilesTab(datasets, rows, assembly) {
    const ret: any = {
        agnostic: [],
        specific: [],
    };
    for (let [biosample, typAcc] of rows.entries()) {
        let celltypedesc = '';
        let tissue = '';
        if ('_agnostic' != biosample) {
            celltypedesc = datasets.byCellType[biosample][0]["cellTypeDesc"]
            tissue = datasets.byCellType[biosample][0]["tissue"]
        }
        const row = {
            "celltypename": biosample,
            "celltypedesc": celltypedesc,
            "tissue": tissue,
            "assembly": assembly,
            "5group": "NA",
            "9state-H3K27ac": "NA",
            "9state-H3K4me3": "NA",
            "9state-CTCF": "NA",
            "9state-DNase": "NA"
        }
        for (let [typ, acc] of typAcc.entries()) {
            row[typ] = acc;
        }
        if ('_agnostic' === biosample) {
            ret["agnostic"].push(row);
        } else {
            ret["specific"].push(row);
        }
    }
    return ret;
}

async function load(assembly) {
    const chromCounts = await Common.chromCounts(assembly);
    const creHist = await Common.creHist(assembly);
    const tf_list = await Common.tfHistoneDnaseList(assembly, 'encode');
    const datasets = await Common.datasets(assembly);
    const rankMethodToCellTypes = await Common.rankMethodToCellTypes(assembly);
    const rankMethodToIDxToCellType = await Common.rankMethodToIDxToCellType(assembly);
    const { toSymbol, toStrand } = await Common.genemap(assembly);
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
        cistrome: {}
    };
    const creBigBeds = await Common.creBigBeds(assembly);
    const ctmap = await Common.makeCtMap(assembly);
    const ctsTable = await Common.makeCTStable(assembly);

    const cache = {
        chromCounts: chromCounts,
        creHist: creHist,

        tf_list: tf_list,

        datasets: datasets,

        rankMethodToCellTypes: rankMethodToCellTypes,
        rankMethodToIDxToCellType: rankMethodToIDxToCellType,

        biosampleTypes: undefined,
        assaymap: undefined,
        ensemblToSymbol: toSymbol,
        ensemblToStrand: toStrand,

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
        ctsTable: ctsTable
    };
    return cache;
}

async function loadGlobal() {
    const colors = require('./colors');
    const helpKeys = await Common.getHelpKeys();
    const files = {
        agnostic: [].concat(cache('hg19').filesList.agnostic).concat(cache('mm10').filesList.agnostic),
        specific: [].concat(cache('hg19').filesList.specific).concat(cache('mm10').filesList.specific),
    }
    const inputData = [].concat(cache('hg19').inputData).concat(cache('mm10').inputData);

    const global_cache = {
        colors: colors,
        helpKeys: { all: helpKeys },
        files: files,
        inputData: inputData,
    };
    return global_cache;
}

let caches: any = {};
let globalcache: any = {};
let loaded = false;
export async function loadCaches() {
    if (loaded) {
        return;
    }
    const hg19 = await load('hg19');
    const mm10 = await load('mm10');
    caches = {
        'hg19': hg19,
        'mm10': mm10,
    };
    globalcache = await loadGlobal();
    loaded = true;
    console.log('Cache loaded: ', Object.keys(caches));
}

export function cache(assembly) {
    return caches[assembly] || {};
}

const Compartments = [
    'cell', 'nucleoplasm', 'cytosol',
    'nucleus', 'membrane', 'chromatin',
    'nucleolus'];

const chrom_lengths = require('../constants').chrom_lengths;
export function global_data(assembly) {
    const c = cache(assembly);
    const datasets = c.datasets;
    return {
        'tfs': c.tf_list,
        'cellCompartments': Compartments,
        'cellTypeInfoArr': datasets.globalCellTypeInfoArr,
        'chromCounts': c.chromCounts,
        'chromLens': chrom_lengths[assembly],
        'creHistBins': c.creHist,
        'geBiosampleTypes': c.geBiosampleTypes,
        'geBiosamples': c.geBiosamples,
        'creBigBedsByCellType': c.creBigBeds,
        'creFiles': c.filesList,
        'inputData': c.inputData,
    };
}

export function global_data_global() {
    return { ...globalcache };
}

export function lookupEnsembleGene(assembly, s) {
    const c = cache(assembly);
    let symbol = c.ensemblToSymbol[s];
    let strand = c.ensemblToStrand[s];
    if (strand) {
        return { symbol, strand };
    }
    const d = s.split('.')[0];
    symbol = c.ensemblToSymbol[d];
    strand = c.ensemblToStrand[d];
    if (strand) {
        return { symbol, strand };
    }

    if (symbol) {
        return { symbol, name: '' };
    }
    return { symbol: s, strand: '' };
}

loadCaches().catch(e => {
    console.log(e);
});
