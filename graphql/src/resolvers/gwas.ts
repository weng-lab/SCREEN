import { GraphQLFieldResolver } from 'graphql';
import * as DbGwas from '../db/db_gwas';

const { UserError } = require('graphql-errors');
const cache = require('../db/db_cache').cache;

class Gwas {
    assembly; studies; byStudy;
    constructor(assembly) {
        this.assembly = assembly;
    }

    async awaitStudies() {
        if (!this.studies) {
            this.studies = await DbGwas.gwasStudies(this.assembly);
            this.byStudy = this.studies.reduce((obj, r) => ({ ...obj, [r['value']]: r }), {});
        }
    }

    checkStudy = (study) => study in this.byStudy;
    totalLDblocks = (gwas_study) => this.byStudy[gwas_study]['total_ldblocks'];

    numLdBlocksOverlap = (gwas_study) => DbGwas.numLdBlocksOverlap(this.assembly, gwas_study);
    numCresOverlap = (gwas_study) => DbGwas.numCresOverlap(this.assembly, gwas_study);
    allCellTypes = async (gwas_study) => {
        const c = cache(this.assembly);
        const cts = await DbGwas.gwasEnrichment(this.assembly, gwas_study);
        const ret = cts ? cts.map(ct => ({ ...ct, ct: c.datasets.byCellTypeValue[ct.ct] })) : undefined;
        return ret;
    }

    async mainTableInfo(gwas_study) {
        const total = await this.totalLDblocks(gwas_study);
        const overlap = await this.numLdBlocksOverlap(gwas_study);
        const overlapStr = `${overlap} (${Math.round((overlap / total) * 100.0)}%)`;
        return [{'totalLDblocks': total,
             'numLdBlocksOverlap': overlap,
             'numLdBlocksOverlapFormat': overlapStr,
             'numCresOverlap': await this.numCresOverlap(gwas_study)}];
    }

    async mainTable(study) {
        return {
            'gwas_study': this.byStudy[study],
            'mainTable': await this.mainTableInfo(study),
            'topCellTypes': await this.allCellTypes(study)
        };
    }

    async cres(gwas_study: string, ct: string | undefined) {
        const c = cache(this.assembly);
        const ctmap = c.ctmap;
        const ctsTable = c.ctsTable;
        const { cres, fieldsOut } = await DbGwas.gwasPercentActive(this.assembly, gwas_study, ct, ctmap, ctsTable);

        // accession, snp, geneid, zscores
        const total = cres.length;
        const activeCres: Array<any> = cres.filter(a =>
            !ct ||
            (a.ctspecific['promoter_zscore'] || 0) > 1.64 ||
            (a.ctspecific['enhancer_zscore'] || 0) > 1.64 ||
            (a.ctspecific['dnase_zscore'] || 0) > 1.64);

        const vcols = {};
        if (ct) {
            for (const f of ['promoter_zscore', 'enhancer_zscore', 'dnase_zscore']) {
                vcols[f] = activeCres.length > 0 && f in activeCres[0].ctspecific;
            }
        } else {
            for (const f of ['k4me3max', 'k27acmax', 'dnasemax']) {
                vcols[f] = true;
            }
        }

        return {
            'accessions': activeCres,
            'vcols': vcols
        };
    }
}

async function gwas(g) {
    return {
        'studies': g.studies,
        'byStudy': g.byStudy
    };
}

async function study(g: Gwas, study) {
    if (!g.checkStudy(study)) {
        throw new UserError('invalid gwas study');
    }
    return g.mainTable(study);
}

async function cres(g: Gwas, study, cellType) {
    if (!g.checkStudy(study)) {
        throw new UserError('invalid gwas study');
    }
    // TODO: check ct!
    return g.cres(study, cellType);
}

export const resolve_gwas_gwas: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const g = source.gwas_obj;
    return gwas(g);
};

export const resolve_gwas_study: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const g = source.gwas_obj;
    const studyarg = args.study;
    return study(g, studyarg);
};

export const resolve_gwas_cres: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const g = source.gwas_obj;
    const study = args.study;
    const cellType = args.cellType;
    return cres(g, study, cellType);
};

export const resolve_gwas: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const g = new Gwas(assembly);
    return g.awaitStudies().then(r => ({ gwas_obj: g }));
};

