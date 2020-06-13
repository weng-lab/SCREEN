import * as Common from '../db/db_common';
import * as DbDe from '../db/db_de';
import { Assembly, Gene, Resolver } from '../types';
import { removeEnsemblVer } from '../utils';

export type DifferentialExpression = {
    isde: boolean;
    fc: number | null;
    ct1: string;
    ct2: string;
    gene: Gene;
};

export const convertCtToDect = (ct: string) =>
    ct
        .replace('C57BL/6_', '')
        .replace('embryo_', '')
        .replace('_days', '')
        .replace('postnatal_', '');

export const resolve_de: Resolver<{ assembly: Assembly; gene: string; ct1: string; ct2: string }> = async (
    source,
    args
): Promise<DifferentialExpression> => {
    const assembly = args.assembly;
    const gene = args.gene;
    const ct1 = convertCtToDect(args.ct1);
    const ct2 = convertCtToDect(args.ct2);
    if (assembly !== 'mm10') {
        throw new Error('Differential expression data only available for mm10.');
    }
    if (ct1 === ct2) {
        throw new Error('Cannot get differential expression between the same celltypes.');
    }
    const completeGene = await Common.genesLoader[assembly].load(gene);
    const ensemblid_ver = completeGene.ensemblid_ver;
    const de = await DbDe.deGenesLoader[assembly].load(`${ct1}:${ct2}:${removeEnsemblVer(ensemblid_ver)}`);
    return {
        gene: completeGene,
        ct1,
        ct2,
        isde: de.isde,
        fc: de.fc,
    } as DifferentialExpression;
};
