import { GraphQLFieldResolver } from 'graphql';
import * as DbGwas from '../db/db_gwas';
import { loadCache } from '../db/db_cache';

const { UserError } = require('graphql-errors');

export class Gwas {
    assembly;
    studies;
    byStudy;
    constructor(assembly) {
        this.assembly = assembly;
    }

    async awaitStudies() {
        const gwas_studies = await loadCache(this.assembly).gwas_studies();
        if (!this.studies) {
            this.studies = gwas_studies;
            this.byStudy = this.studies.reduce((obj, r) => {
                obj[r.value] = r;
                return obj;
            }, {});
        }
    }

    checkStudy = (study: string) => study in this.byStudy;
    totalLDblocks = gwas_study => this.byStudy[gwas_study]['total_ldblocks'];

    numLdBlocksOverlap = gwas_study => DbGwas.numLdBlocksOverlap(this.assembly, gwas_study);
    numCresOverlap = gwas_study => DbGwas.numCresOverlap(this.assembly, gwas_study);
    allCellTypes = async gwas_study => {
        const datasets = await loadCache(this.assembly).datasets();
        const cts = await DbGwas.gwasEnrichment(this.assembly, gwas_study);
        const ret = cts ? cts.map(ct => ({ ...ct, ct: datasets.byCellTypeValue[ct.ct] })) : undefined;
        return ret;
    };

    async cres(gwas_study: string, ct: string | undefined) {
        const acache = loadCache(this.assembly);
        const ctmap = await acache.ctmap();
        const ctsTable = await acache.ctsTable();
        const cres = await DbGwas.gwasPercentActive(this.assembly, gwas_study, ct !== 'none' ? ct : undefined, ctmap);

        const activeCres = cres.filter(
            a => !ct || (a.h3k4me3_zscore || 0) > 1.64 || (a.h3k27ac_zscore || 0) > 1.64 || (a.dnase_zscore || 0) > 1.64
        );

        // accession, snp, geneid, zscores
        return activeCres.map(c => ({ cRE: c, geneid: c.geneid, snps: c.snps }));
    }
}

export const resolve_gwas_gwas: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const g = source.gwas_obj;
    return {
        studies: g.studies,
        byStudy: g.byStudy,
    };
};

export const resolve_gwas_study: GraphQLFieldResolver<any, any> = async (source, args, context, info) => {
    const g = source.gwas_obj;
    const studyarg = args.study;
    if (!g.checkStudy(studyarg)) {
        throw new UserError('invalid gwas study');
    }
    return {
        study_name: studyarg,
        gwas_obj: g,
    };
};

export const resolve_gwas_study_info = async source => {
    const g = source.gwas_obj;
    const study_name = source.study_name;
    return {
        ...g.byStudy[study_name],
        totalLDblocks: await g.totalLDblocks(study_name),
        numLdBlocksOverlap: await g.numLdBlocksOverlap(study_name),
        numCresOverlap: await g.numCresOverlap(study_name),
    };
};

export const resolve_gwas_study_topCellTypes = async source => {
    const g: Gwas = source.gwas_obj;
    const study_name = source.study_name;
    return g.allCellTypes(study_name);
};

export const resolve_gwas_study_cres: GraphQLFieldResolver<any, any> = async (source, args) => {
    const g: Gwas = source.gwas_obj;
    const study_name = source.study_name;
    const cellType = args.cellType;
    // TODO: check ct!
    return g.cres(study_name, cellType);
};

export const resolve_gwas: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const g = new Gwas(assembly);
    return g.awaitStudies().then(r => ({ gwas_obj: g }));
};
