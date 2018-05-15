import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import * as DbDe from '../db/db_de';
import { cache } from '../db/db_cache';
import * as CoordUtils from '../coord_utils';
import { dbcre } from '../db/db_cre_table';

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
    range;

    constructor(assembly, gene, ct1, ct2) {
        this.assembly = assembly;
        this.gene = gene;
        this.ct1 = ct1;
        this.ct2 = ct2;

        this.halfWindow = 250 * 1000 * 2;
        this.thres = 0;
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

    async nearbyDEs() {
        // limb_14.5 from C57BL-6_limb_embryo_14.5_days
        const ct1 = this.ct1
            .replace('C57BL/6_', '')
            .replace('embryo_', '')
            .replace('_days', '')
            .replace('postnatal_', '');
        const ct2 = this.ct2
            .replace('C57BL/6_', '')
            .replace('embryo_', '')
            .replace('_days', '')
            .replace('postnatal_', '');

        const cd = await this.coord();
        const c = await cache(this.assembly);

        const nearbyDEs = await DbDe.nearbyDEs(this.assembly, this.range, ct1, ct2, 0.05, c.de_ctidmap);
        if (nearbyDEs.length === 0) {
            return undefined;
        }
        const degenes = nearbyDEs.reduce((prev, d) => {
            prev[d.ensembl] = +(Math.round(+(d['log2foldchange'] + 'e+3')) + 'e-3');
            return prev;
        }, {});

        const genes = await DbDe.genesInRegion(this.assembly, this.range.chrom, this.range.start, this.range.end);
        return genes.map(g => {
            const ensemblid = g.ensemblid;
            const fc = degenes[ensemblid];
            const gene = c.ensemblToGene[ensemblid];
            return {
                isde: !!fc,
                fc,
                gene,
            };
        });
    }

    parseCE(typ, c: dbcre & { zscore_1: number; zscore_2: number; }) {
        const radius = (c.end - c.start) / 2;
        return {
            center: radius + c.start,
            value: +(Math.round(+(+(c.zscore_2 - c.zscore_1) + 'e+3')) + 'e-3'),
            typ: typ,
            ccRE: c,
        };
    }

    async nearbyPromoters() {
        const c = await cache(this.assembly);
        const rmLookup = c.rankMethodToIDxToCellType['H3K4me3'];
        if (!(this.ct1 in rmLookup && this.ct2 in rmLookup)) {
            return [];
        }
        const ct1PromoterIdx = rmLookup[this.ct1];
        const ct2PromoterIdx = rmLookup[this.ct2];

        const cols = [
            `h3k4me3_zscores[${ct1PromoterIdx}] as zscore_1`,
            `h3k4me3_zscores[${ct2PromoterIdx}] as zscore_2`,
        ];
        const cres = await DbDe.nearbyCREs(this.assembly, this.range, cols, true);
        return cres
            .filter(c => c['zscore_1'] > this.thres || c['zscore_2'] > this.thres)
            .map(c => this.parseCE('promoter-like signature', c));
    }

    async nearbyEnhancers() {
        const c = await cache(this.assembly);
        const rmLookup = c.rankMethodToIDxToCellType['H3K27ac'];
        if (!(this.ct1 in rmLookup && this.ct2 in rmLookup)) {
            return [];
        }
        const ct1EnhancerIdx = rmLookup[this.ct1];
        const ct2EnhancerIdx = rmLookup[this.ct2];

        const cols = [
            `h3k27ac_zscores[${ct1EnhancerIdx}] as zscore_1`,
            `h3k27ac_zscores[${ct2EnhancerIdx}] as zscore_2`,
        ];
        const cres = await DbDe.nearbyCREs(this.assembly, this.range, cols, false);
        return cres
            .filter(c => c['zscore_1'] > this.thres || c['zscore_2'] > this.thres)
            .map(c => this.parseCE('enhancer-like signature', c));
    }

    async diffCREs() {
        return ([] as Array<any>).concat(await this.nearbyPromoters()).concat(await this.nearbyEnhancers());
    }
}

async function de(assembly, gene, ct1, ct2) {
    const de = new DE(assembly, gene, ct1, ct2);

    const genecoord = await de.coord();
    const c = CoordUtils.expanded(genecoord, de.halfWindow);
    de.range = c;

    const nearbyDEs = await de.nearbyDEs();
    const diffCREs = await de.diffCREs();

    return {
        gene: {
            coords: genecoord,
            gene: de.names[0],
            ensemblid_ver: de.names[1],
        },
        diffCREs: diffCREs,
        nearbyGenes: nearbyDEs,
        min: c.start,
        max: c.end,
    };
}

export const resolve_de: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const gene = args.gene;
    const ct1 = args.ct1;
    const ct2 = args.ct2;
    return de(assembly, gene, ct1, ct2);
};
