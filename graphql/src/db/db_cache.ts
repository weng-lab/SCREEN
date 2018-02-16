import * as Path from 'path';
import * as Common from './db_common';


function indexFilesTab(rows) {
    const ret: any = [];
    const WWW = 'http://bib7.umassmed.edu/~purcarom/screen/ver4/v10';
    for (const r of rows) {
        const d = { ...r };
        const accs = [r['dnase'], r['h3k4me3'], r['h3k27ac'], r['ctcf']].filter(a => a !== 'NA');
        const fn = accs.join('_') + '.cREs.bigBed.bed.gz';
        d['fiveGroup'] = [Path.join(WWW, fn), fn];
        ret.push(d);
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
    const filesList = indexFilesTab(Object.keys(nineState).map(k => nineState[k]));
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
    const files = [].concat(cache('hg19').filesList).concat(cache('mm10').filesList);
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
