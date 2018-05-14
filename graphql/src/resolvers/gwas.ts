import { GraphQLFieldResolver } from 'graphql';
import * as DbGwas from '../db/db_gwas';
import { cache } from '../db/db_cache';

const { UserError } = require('graphql-errors');

class Gwas {
    assembly;
    studies;
    byStudy;
    constructor(assembly) {
        this.assembly = assembly;
    }

    async awaitStudies() {
        const c = await cache(this.assembly);
        if (!this.studies) {
            this.studies = c.gwas_studies;
            this.byStudy = this.studies.reduce((obj, r) => {
                obj[r.value] = r;
                return obj;
            }, {});
        }
    }

    checkStudy = study => study in this.byStudy;
    totalLDblocks = gwas_study => this.byStudy[gwas_study]['total_ldblocks'];

    numLdBlocksOverlap = gwas_study => DbGwas.numLdBlocksOverlap(this.assembly, gwas_study);
    numCresOverlap = gwas_study => DbGwas.numCresOverlap(this.assembly, gwas_study);
    allCellTypes = async gwas_study => {
        const c = await cache(this.assembly);
        const cts = await DbGwas.gwasEnrichment(this.assembly, gwas_study);
        const ret = cts ? cts.map(ct => ({ ...ct, ct: c.datasets.byCellTypeValue[ct.ct] })) : undefined;
        return ret;
    };

    async mainTableInfo(gwas_study) {
        const total = await this.totalLDblocks(gwas_study);
        const overlap = await this.numLdBlocksOverlap(gwas_study);
        const overlapStr = `${overlap} (${Math.round(overlap / total * 100.0)}%)`;
        return [
            {
                totalLDblocks: total,
                numLdBlocksOverlap: overlap,
                numLdBlocksOverlapFormat: overlapStr,
                numCresOverlap: await this.numCresOverlap(gwas_study),
            },
        ];
    }

    async mainTable(study) {
        return {
            gwas_study: this.byStudy[study],
            mainTable: await this.mainTableInfo(study),
            topCellTypes: await this.allCellTypes(study),
        };
    }

    async cres(gwas_study: string, ct: string | undefined) {
        const acache = await cache(this.assembly);
        const ctmap = acache.ctmap;
        const ctsTable = acache.ctsTable;
        const cres = await DbGwas.gwasPercentActive(this.assembly, gwas_study, ct !== 'none' ? ct : undefined, acache);

        const activeCres = cres.filter(
            a =>
                !ct ||
                (a.promoter_zscore || 0) > 1.64 ||
                (a.enhancer_zscore || 0) > 1.64 ||
                (a.dnase_zscore || 0) > 1.64
        );

        // accession, snp, geneid, zscores
        return activeCres.map(c => ({ cRE: c, geneid: c.geneid, snps: c.snps }));
    }
}

async function gwas(g) {
    return {
        studies: g.studies,
        byStudy: g.byStudy,
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

export const resolve_gwas_study: GraphQLFieldResolver<any, any> = async (source, args, context, info) => {
    const g = source.gwas_obj;
    const studyarg = args.study;
    return { ...(await study(g, studyarg)), study: studyarg, gwas_obj: g };
};

export const resolve_gwas_cres: GraphQLFieldResolver<any, any> = async (source, args, context, info) => {
    const g = source.gwas_obj;
    const study = source.study;
    const cellType = args.cellType;
    return cres(g, study, cellType);
};

export const resolve_gwas: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const g = new Gwas(assembly);
    return g.awaitStudies().then(r => ({ gwas_obj: g }));
};
