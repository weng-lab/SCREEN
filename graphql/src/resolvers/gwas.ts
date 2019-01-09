import { GraphQLFieldResolver } from 'graphql';
import * as DbGwas from '../db/db_gwas';
import { loadCache, ccRECtspecificLoaders } from '../db/db_cache';
import { Assembly } from '../types';
import { UserInputError } from 'apollo-server-express';

export class Gwas {
    assembly: Assembly;
    studies: DbGwas.DBGwasStudy[];
    byStudy: Record<string, DbGwas.DBGwasStudy>;
    constructor(assembly) {
        this.assembly = assembly;
    }

    async awaitStudies() {
        const gwas_studies = await loadCache(this.assembly).gwas_studies();
        if (!this.studies) {
            this.studies = gwas_studies;
            this.byStudy = this.studies.reduce((obj, r) => {
                obj[r.name] = r;
                return obj;
            }, {});
        }
    }

    checkStudy = (study: string) => study in this.byStudy;

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
        const celltype = ct !== 'none' ? ct : undefined;
        const cres = await DbGwas.gwasPercentActive(this.assembly, gwas_study, celltype, ctmap);
        let activeCres: DbGwas.gwascre[] = [];
        if (celltype) {
            const ctspecific = await ccRECtspecificLoaders[this.assembly].loadMany(
                cres.map(c => `${c.accession}::${celltype}`)
            );
            cres.forEach((cre, index) => {
                const cts = ctspecific[index];
                if (
                    (cts.h3k4me3_zscore || 0) > 1.64 ||
                    (cts.h3k27ac_zscore || 0) > 1.64 ||
                    (cts.dnase_zscore || 0) > 1.64
                ) {
                    activeCres.push(cre);
                }
            });
        } else {
            activeCres = cres;
        }

        // accession, snp, geneid, zscores
        return activeCres.map(c => ({ cRE: c, geneid: c.geneid, snps: c.snps }));
    }
}

export const resolve_gwas_studies: GraphQLFieldResolver<any, any> = source => {
    const g: Gwas = source.gwas_obj;
    return g.studies.map(study => ({
        study_name: study.name,
        gwas_obj: g,
        ...g.byStudy[study.name],
    }));
};

export const resolve_gwas_study: GraphQLFieldResolver<any, any> = (source, args) => {
    const g: Gwas = source.gwas_obj;
    const studyarg = args.study;
    if (!g.checkStudy(studyarg)) {
        throw new UserInputError('invalid gwas study');
    }
    return {
        study_name: studyarg,
        gwas_obj: g,
        ...g.byStudy[studyarg],
    };
};

export const resolve_gwas_study_numLdBlocksOverlap = async source => {
    const g: Gwas = source.gwas_obj;
    const study_name = source.study_name;
    return g.numLdBlocksOverlap(study_name);
};

export const resolve_gwas_study_numCresOverlap = async source => {
    const g: Gwas = source.gwas_obj;
    const study_name = source.study_name;
    return g.numCresOverlap(study_name);
};

export const resolve_gwas_study_allSNPs = async source => {
    const g: Gwas = source.gwas_obj;
    const study_name = source.study_name;
    const snps = await DbGwas.allSNPsInStudy(g.assembly, study_name, g);
    return snps;
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

export const resolve_gwas_snps: GraphQLFieldResolver<any, any> = async (source, args, context, info) => {
    const g: Gwas = source.gwas_obj;
    const assembly = g.assembly;
    const search: string = args.search;
    return DbGwas.searchSNPs(assembly, search);
};

export const resolve_gwas: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const g = new Gwas(assembly);
    return g.awaitStudies().then(r => ({ gwas_obj: g }));
};
