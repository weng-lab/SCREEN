import * as Common from './db_common';

async function load(assembly) {
    const colors = require('./colors');
    const chromCounts = await Common.chromCounts(assembly);
    const creHist = await Common.creHist(assembly);
    const geneIDsToApprovedSymbol = await Common.geneIDsToApprovedSymbol(assembly);
    const ctmap = await Common.makeCtMap(assembly);

    const cache = {
        colors: colors,

        chromCounts: chromCounts,
        creHist: creHist,

        tf_list: undefined,

        datasets: undefined,

        rankMethodToCellTypes: undefined,
        rankMethodToIDxToCellType: undefined,
        rankMethodToIDxToCellTypeZeroBased: undefined,

        biosampleTypes: undefined,
        assaymap: undefined,
        ensemblToSymbol: undefined,
        ensemblToStrand: undefined,

        nineState: undefined,
        filesList: undefined,

        moreTracks: undefined,

        geBiosampleTypes: undefined,

        geneIDsToApprovedSymbol: geneIDsToApprovedSymbol,

        help_keys: undefined,

        tfHistCounts: undefined,

        creBigBeds: undefined,

        ctmap: ctmap
    };
    return cache;
}

let caches = {};
let loaded = false;
async function loadCaches() {
    if (loaded) {
        return;
    }
    const hg19 = await load('hg19');
    const mm10 = await load('mm10');
    const cachesawait = {
        'hg19': hg19,
        'mm10': mm10,
    };
    caches = cachesawait;
    loaded = true;
    console.log('Cache loaded.');
}

function cache(assembly) {
    return caches[assembly] || {};
}

exports.loadCaches = loadCaches;
exports.cache = cache;

loadCaches();
