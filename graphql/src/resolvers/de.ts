import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import * as DbDe from '../db/db_de';
import { loadCache } from '../db/db_cache';
import * as CoordUtils from '../coord_utils';
import { dbcre } from '../db/db_cre_table';
import { ChromRange, Gene } from '../types';
import { UserInputError } from 'apollo-server-core';

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

class DE {
    assembly;
    gene;
    ct1;
    ct2;
    pos;
    names;
    halfWindow;
    thres;
    radiusScale;

    constructor(assembly, gene, ct1, ct2) {
        this.assembly = assembly;
        this.gene = gene;
        this.ct1 = ct1;
        this.ct2 = ct2;

        this.halfWindow = 250 * 1000 * 2;
        this.thres = 1.64;
        this.radiusScale = 10;
    }

    async coord() {
        if (!this.pos) {
            const { pos, names } = await Common.genePos(this.assembly, this.gene);
            if (!pos) {
                throw new Error('Invalid pos for ' + this.gene);
            }
            this.pos = pos;
            this.names = names;
        }
        return this.pos;
    }

    async nearbyDEs(range: ChromRange) {
        // limb_14.5 from C57BL-6_limb_embryo_14.5_days
        const ct1 = convertCtToDect(this.ct1);
        const ct2 = convertCtToDect(this.ct2);

        const cd = await this.coord();
        const c = loadCache(this.assembly);
        const de_ctidmap = await c.de_ctidmap();
        const ensemblToGene = await c.ensemblToGene();

        const nearbyDEs = await DbDe.nearbyDEs(this.assembly, range, ct1, ct2, 0.05, de_ctidmap);
        if (nearbyDEs.length === 0) {
            return [];
        }
        let range_min = Number.MAX_SAFE_INTEGER;
        let range_max = Number.MIN_SAFE_INTEGER;
        const degenes = nearbyDEs.reduce((prev, d) => {
            prev[d.ensembl] = +(Math.round(+(d['log2foldchange'] + 'e+3')) + 'e-3');
            range_min = Math.min(range_min, d.start);
            range_max = Math.max(range_max, d.stop);
            return prev;
        }, {});

        const genes = await DbDe.genesInRegion(this.assembly, range.chrom, range_min, range_max);
        return genes.map(g => {
            const ensemblid = g.ensemblid;
            const fc = degenes[ensemblid];
            const gene = ensemblToGene[ensemblid];
            return {
                isde: !!fc,
                fc,
                gene,
                ct1: this.ct1,
                ct2: this.ct2,
            };
        });
    }

    parseCE(typ, c: dbcre & { zscore_1: number; zscore_2: number }) {
        const radius = (c.end - c.start) / 2;
        return {
            center: radius + c.start,
            value: +(Math.round(+(+(c.zscore_2 - c.zscore_1) + 'e+3')) + 'e-3'),
            typ: typ,
            ccRE: c,
        };
    }

    async nearbyPromoters(range: ChromRange) {
        const rankMethodToIDxToCellType = await loadCache(this.assembly).rankMethodToIDxToCellType();
        const rmLookup = rankMethodToIDxToCellType['H3K4me3'];
        if (!(this.ct1 in rmLookup && this.ct2 in rmLookup)) {
            return [];
        }
        const ct1PromoterIdx = rmLookup[this.ct1];
        const ct2PromoterIdx = rmLookup[this.ct2];

        const cols = [
            `h3k4me3_zscores[${ct1PromoterIdx}] as zscore_1`,
            `h3k4me3_zscores[${ct2PromoterIdx}] as zscore_2`,
        ];
        const cres = await DbDe.nearbyCREs(this.assembly, range, cols, true);
        return cres
            .filter(c => c['zscore_1'] > this.thres || c['zscore_2'] > this.thres)
            .map(c => this.parseCE('promoter-like signature', c));
    }

    async nearbyEnhancers(range: ChromRange) {
        const rankMethodToIDxToCellType = await loadCache(this.assembly).rankMethodToIDxToCellType();
        const rmLookup = rankMethodToIDxToCellType['H3K27ac'];
        if (!(this.ct1 in rmLookup && this.ct2 in rmLookup)) {
            return [];
        }
        const ct1EnhancerIdx = rmLookup[this.ct1];
        const ct2EnhancerIdx = rmLookup[this.ct2];

        const cols = [
            `h3k27ac_zscores[${ct1EnhancerIdx}] as zscore_1`,
            `h3k27ac_zscores[${ct2EnhancerIdx}] as zscore_2`,
        ];
        const cres = await DbDe.nearbyCREs(this.assembly, range, cols, false);
        return cres
            .filter(c => c['zscore_1'] > this.thres || c['zscore_2'] > this.thres)
            .map(c => this.parseCE('enhancer-like signature', c));
    }

    async diffCREs(range: ChromRange) {
        return ([] as Array<any>).concat(await this.nearbyPromoters(range)).concat(await this.nearbyEnhancers(range));
    }
}

async function de(assembly, gene, ct1, ct2) {
    const de = new DE(assembly, gene, ct1, ct2);

    const genecoord = await de.coord();
    const expandedgenecoord = CoordUtils.expanded(genecoord, de.halfWindow);

    const nearbyDEs = await de.nearbyDEs(expandedgenecoord);
    if (nearbyDEs.length === 0) {
        return {
            gene: {
                coords: genecoord,
                gene: de.names[0],
                ensemblid_ver: de.names[1],
            },
            diffCREs: [],
            nearbyGenes: undefined,
            min: genecoord.start,
            max: genecoord.end,
        };
    }

    const nearbyDEsmin = nearbyDEs
        .map(d => d.gene.coords.start)
        .reduce((min, curr) => Math.min(min, curr), Number.MAX_SAFE_INTEGER);
    const nearbyDEsmax = nearbyDEs
        .map(d => d.gene.coords.end)
        .reduce((max, curr) => Math.max(max, curr), Number.MIN_SAFE_INTEGER);

    const center = (nearbyDEsmax - nearbyDEsmin) / 2 + nearbyDEsmin;
    const halfWindow = Math.max(de.halfWindow, (nearbyDEsmax - nearbyDEsmin) / 2);
    const range = {
        assembly,
        chrom: genecoord.chrom,
        start: Math.floor(Math.max(0, center - halfWindow)),
        end: Math.ceil(center + halfWindow), // TODO: chrom max
    };
    const diffCREs = await de.diffCREs(range);

    return {
        gene: {
            coords: genecoord,
            gene: de.names[0],
            ensemblid_ver: de.names[1],
        },
        diffCREs: diffCREs,
        nearbyGenes: nearbyDEs,
        min: range.start,
        max: range.end,
    };
}

export const resolve_de: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const gene = args.gene;
    const ct1 = args.ct1;
    const ct2 = args.ct2;
    if (assembly === 'hg19') {
        throw new UserInputError('hg19 does not have differential gene expression data');
    }
    return de(assembly, gene, ct1, ct2);
};
