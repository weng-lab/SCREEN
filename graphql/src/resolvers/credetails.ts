import * as DbCommon from '../db/db_common';
import { getCreTable } from '../db/db_cre_table';
import { natsort, getAssemblyFromCre } from '../utils';
import HelperGrouper from '../helpergrouper';
import { getByGene } from './rampage';
import { loadCache, Assembly } from '../db/db_cache';
import { select_cre_intersections, orthologs } from '../db/db_credetails';

const request = require('request-promise-native');
const { UserError } = require('graphql-errors');

export class CREDetails {
    assembly;
    accession;
    _coord: Promise<{ chrom: string; start: number; end: number }>;
    genesAll;
    genesPC;

    constructor(assembly: Assembly, accession: string) {
        this.assembly = assembly;
        this.accession = accession;
    }

    async coord() {
        if (!this._coord) {
            this._coord = DbCommon.crePos(this.assembly, this.accession) as any;
        }
        return await this._coord;
    }

    static getCtData = (ctvalue, ctmap, key, ranks) =>
        ctvalue in ctmap[key] ? ranks[key][ctmap[key][ctvalue] - 1] : undefined;

    async topTissues() {
        const c = loadCache(this.assembly);
        const ctmap = await c.ctmap();
        const datasets = await c.datasets();
        const coord = await this.coord();
        // ['h3k4me3', 'h3k27ac', 'dnase', 'ctcf']
        const ranks = await DbCommon.creRanks(this.assembly, this.accession);
        const data = datasets.globalCellTypeInfoArr.map(ct => {
            const dnase = CREDetails.getCtData(ct.value, ctmap, 'dnase', ranks);
            const h3k4me3 = CREDetails.getCtData(ct.value, ctmap, 'h3k4me3', ranks);
            const h3k27ac = CREDetails.getCtData(ct.value, ctmap, 'h3k27ac', ranks);
            const ctcf = CREDetails.getCtData(ct.value, ctmap, 'ctcf', ranks);
            return {
                ct,
                dnase,
                h3k4me3,
                h3k27ac,
                ctcf,
            };
        });
        return data;
    }

    private async awaitGenes() {
        const coord = await this.coord();
        if (!this.genesAll || !this.genesPC) {
            const { genesAll, genesPC } = await DbCommon.creGenes(this.assembly, this.accession, coord.chrom);
            this.genesAll = genesAll;
            this.genesPC = genesPC;
        }
    }

    async nearbyGenes(): Promise<{ gene: any; distance: number; pc: boolean }[]> {
        await this.awaitGenes();
        const pcGenes = this.genesPC.map(g => g['approved_symbol']);
        return this.genesAll
            .map(g => ({
                gene: {
                    gene: g.approved_symbol,
                    ensemblid_ver: g.ensemblid_ver,
                    coords: {
                        chrom: g.chrom,
                        start: g.start,
                        end: g.stop,
                        strand: g.strand,
                    },
                    tsscoords: {
                        chrom: g.tss_chrom,
                        start: g.tss_start,
                        end: g.tss_stop,
                        strand: g.strand,
                    },
                },
                distance: g.distance,
                pc: pcGenes.includes(g.approved_symbol),
            }))
            .sort((a, b) => a.distance - b.distance);
    }

    async nearbyPcGenes() {
        await this.awaitGenes();
        return this.genesPC
            .map(g => ({
                gene: {
                    gene: g.approved_symbol,
                    ensemblid_ver: g.ensemblid_ver,
                    coords: {
                        chrom: g.chrom,
                        start: g.start,
                        end: g.stop,
                        strand: g.strand,
                    },
                    tsscoords: {
                        chrom: g.tss_chrom,
                        start: g.tss_start,
                        end: g.tss_stop,
                        strand: g.strand,
                    },
                },
                distance: g.distance,
            }))
            .sort((a, b) => a.distance - b.distance);
    }

    async genesInTad(tadInfo) {
        if ('mm10' == this.assembly || !tadInfo) {
            return [];
        }
        const coord = await this.coord();
        const rows = await DbCommon.genesInTad(this.assembly, this.accession, coord.chrom, tadInfo);
        return rows.map(g => ({
            gene: g.approved_symbol,
            ensemblid_ver: g.ensemblid_ver,
            coords: {
                chrom: g.chrom,
                start: g.start,
                end: g.stop,
            },
        }));
    }

    async cresInTad(tadInfo) {
        if ('mm10' == this.assembly || !tadInfo) {
            return [];
        }
        const coord = await this.coord();
        return DbCommon.cresInTad(this.assembly, this.accession, coord.chrom, coord.start, coord.end, tadInfo);
    }

    async intersectingSnps(halfWindow) {
        return DbCommon.intersectingSnps(this.assembly, this.accession, await this.coord(), halfWindow);
    }

    async distToNearbyCREs(halfWindow) {
        return DbCommon.distToNearbyCREs(this.assembly, this.accession, await this.coord(), halfWindow);
    }

    async peakIntersectCount(eset) {
        const tfHistCounts = await loadCache(this.assembly).tfHistCounts();
        return DbCommon.peakIntersectCount(this.assembly, this.accession, tfHistCounts[eset], eset);
    }

    async getTadInfo() {
        return DbCommon.getTadOfCRE(this.assembly, this.accession);
    }
}

export async function resolve_credetails(source, args, context, info) {
    const accession: string = args.accession;
    const assembly = getAssemblyFromCre(accession);
    if (!assembly) {
        throw new UserError('Invalid accession: ' + accession);
    }

    const ctmap = await loadCache(assembly as Assembly).ctmap();
    const res = await getCreTable(assembly, ctmap, { accessions: [accession] }, {});
    if (res.total === 0) {
        throw new UserError('Invalid accession: ' + accession);
    }

    return res.cres[0];
}

function incrementAndCheckDetailsCount(context) {
    const count = context.detailsresolvecount || 0;
    if (count >= 5) {
        throw new UserError(
            'Requesting details of a ccRE is only allowed for a maximum of 5 ccREs per query, for performance.'
        );
    }
    context.detailsresolvecount = count + 1;
}

export async function resolve_details(source, args, context, info) {
    incrementAndCheckDetailsCount(context);
    const accession: string = source.accession;
    const assembly = source.assembly;
    const details = new CREDetails(assembly, accession);
    return { details };
}

export async function resolve_cre_topTissues(source, args, context, info) {
    const cre: CREDetails = source.details;
    return cre.topTissues();
}

export async function resolve_cre_nearbyGenomic(source, args, context, info) {
    const cre: CREDetails = source.details;
    const accession = cre.accession;
    const assembly = cre.assembly;

    const tadInfo = assembly === 'mm10' ? {} : await cre.getTadInfo();
    return { cre, tadInfo };
}

export async function resolve_cre_nearbyGenomic_snps(source, args) {
    const cre: CREDetails = source.cre;
    return cre.intersectingSnps(10000); // 10 KB
}

export async function resolve_cre_nearbyGenomic_nearbyCREs(source, args) {
    const cre: CREDetails = source.cre;
    return cre.distToNearbyCREs(1000000); // 1 MB
}

export async function resolve_cre_nearbyGenomic_nearbyGenes(source, args) {
    const cre: CREDetails = source.cre;
    return cre.nearbyGenes();
}

export async function resolve_cre_nearbyGenomic_genesInTad(source, args) {
    const cre: CREDetails = source.cre;
    const tadInfo = source.tadInfo;
    return cre.genesInTad(tadInfo);
}

export async function resolve_cre_nearbyGenomic_re_tads(source, args) {
    const cre: CREDetails = source.cre;
    const tadInfo = source.tadInfo;
    return cre.cresInTad(tadInfo);
}

export async function resolve_cre_fantomCat(source, args, context, info) {
    const cre: CREDetails = source.details;
    const process = async key => {
        const results = await select_cre_intersections(cre.assembly, cre.accession, key);
        for (const result of results) {
            result['other_names'] = result['genename'] != result['geneid'] ? result['genename'] : '';
            if (result['aliases'] != '') {
                if (result['other_names'] != '') {
                    result['other_names'] += ', ';
                }
                result['other_names'] += result['aliases'].split('|').join(', ');
            }
        }
        return results;
    };
    if (cre.assembly === 'mm10') {
        throw new UserError('mm10 does not have FANTOM CAT data available.');
    }
    return {
        fantom_cat: await process('intersection'),
        fantom_cat_twokb: await process('twokbintersection'),
    };
}

export async function resolve_cre_ortholog(source, args, context, info) {
    const cre: CREDetails = source.details;
    const ortholog = await orthologs(cre.assembly, cre.accession);
    return ortholog;
}

export async function resolve_cre_tfIntersection(source, args, context, info) {
    const cre: CREDetails = source.details;
    return await cre.peakIntersectCount('peak');
}

export async function resolve_cre_cistromeIntersection(source, args, context, info) {
    const cre: CREDetails = source.details;
    return await cre.peakIntersectCount('cistrome');
}

export async function resolve_cre_linkedGenes(source, args, context, info) {
    const cre: CREDetails = source.details;
    if ('mm10' === cre.assembly) {
        return [];
    }
    return await DbCommon.linkedGenes(cre.assembly, cre.accession);
}

export async function resolve_cre_target_data(source, args, context, info) {
    const cre: CREDetails = source.details;
    const target = args.target;
    const eset = args.eset;
    const type = args.target_type;
    return await DbCommon.targetExps(cre.assembly, cre.accession, target, eset, type);
}

const minipeaks_host = 'http://screen.encodeproject.org/api/dataws/re_detail/miniPeaks';
// const minipeaks_host = 'http://screen.encodeproject.org/api/crews/re_detail/miniPeaks';
export async function resolve_cre_miniPeaks(source, args, context, info) {
    const cre: CREDetails = source.details;
    const accession = cre.accession;
    const assembly = cre.assembly;
    const options = {
        method: 'POST',
        uri: minipeaks_host,
        body: {
            accession,
            assembly,
        },
        json: true,
    };
    const res = await request(options);
    return res[accession].rows;
}
