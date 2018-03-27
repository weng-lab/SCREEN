import * as DbCommon from '../db/db_common';
import * as DbCreTable from '../db/db_cre_table';
import * as DbCreDetails from '../db/db_credetails';
import { mapcre } from './cretable';
import { natsort, getAssemblyFromCre } from '../utils';
import HelperGrouper from '../helpergrouper';
import { getByGene } from './rampage';

const request = require('request-promise-native');
const { UserError } = require('graphql-errors');
const cache = require('../db/db_cache').cache;

class CRE {
    assembly; accession;
    _coord;
    genesAll; genesPC;

    constructor(assembly, accession) {
        this.assembly = assembly;
        this.accession = accession;
    }

    async coord() {
        if (!this._coord) {
            this._coord = DbCommon.crePos(this.assembly, this.accession);
        }
        return await this._coord;
    }

    async topTissues() {
        const c = cache(this.assembly);
        // ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
        const rmToCts = c.rankMethodToCellTypes;

        const coord = await this.coord();
        // ['enhancer', 'h3k4me3', 'h3k27ac', 'promoter', 'dnase', 'insulator', 'ctcf']
        const ranks = await DbCommon.creRanks(this.assembly, this.accession);

        const get_rank = (ct, d) => ct in d ? d[ct] : -11.0;

        const arrToCtDict = (arr, cts) => {
            if (arr.length != cts.length) {
                console.log('****************************');
                console.log('error in top tissues', arr.length, cts.length);
                console.log('arr', arr);
                console.log('cts', cts);
                console.log('****************************');
                console.assert(arr.length == cts.length);
            }
            const ret: any = {};
            arr.forEach((v, idx) => {
                ret[cts[idx]] = v;
            });
            return ret;
        };

        const ctToTissue = (ct) => {
            const ctinfo = c.datasets.byCellTypeValue[ct];
            return ctinfo ? ctinfo['tissue'] : '';
        };

        const makeArrRanks = (rm1) => {
            const ret: Array<any> = [];
            const oneAssay = arrToCtDict(ranks[rm1.toLowerCase()], rmToCts[rm1]);
            for (const ct of Object.keys(oneAssay)) {
                const v = oneAssay[ct];
                const r = {'tissue': ctToTissue(ct), 'ct': c.datasets.byCellTypeValue[ct], 'one': v};
                ret.push(r);
            }
            return ret;
        };

        const makeArrMulti = (rm1, rm2) => {
            const ret: Array<any> = [];
            const oneAssay = arrToCtDict(ranks[rm1.toLowerCase()], rmToCts[rm1]);
            const multiAssay = arrToCtDict(ranks[rm2.toLowerCase()], rmToCts[rm2]);
            for (const ct of Object.keys(oneAssay)) {
                const v = oneAssay[ct];
                const r = {
                    'tissue': ctToTissue(ct),
                    'ct': c.datasets.byCellTypeValue[ct],
                    'one': v,
                    'two': get_rank(ct, multiAssay)
                };
                ret.push(r);
            }
            return ret;
        };

        return {
            'dnase': makeArrRanks('DNase'),
            'promoter': makeArrMulti('H3K4me3', 'Promoter'),
            'enhancer': makeArrMulti('H3K27ac', 'Enhancer'),
            'ctcf': makeArrMulti('CTCF', 'Insulator')
        };
    }

    async nearbyGenes() {
        const coord = await this.coord();
        if (!this.genesAll || !this.genesPC) {
            const { genesAll, genesPC } = await DbCommon.creGenes(this.assembly, this.accession, coord.chrom);
            this.genesAll = genesAll;
            this.genesPC = genesPC;
        }
        const pcGenes = this.genesPC.map(g => g['approved_symbol']);
        const ret: Array<any> = [];
        for (const g of this.genesPC) {
            ret.push({
                'name': g['approved_symbol'],
                'distance': g['distance'],
                'ensemblid_ver': g['ensemblid_ver'],
                'chrom': g['chrom'],
                'start': g['start'],
                'stop': g['stop']
            });
        }
        for (const g of this.genesAll) {
            if (g['approved_symbol'] in pcGenes) {
                continue;
            }
            ret.push({
                'name': g['approved_symbol'],
                'distance': g['distance'],
                'ensemblid_ver': g['ensemblid_ver'],
                'chrom': g['chrom'],
                'start': g['start'],
                'stop': g['stop']
            });
        }
        ret.sort((a, b) => a['distance'] - b['distance']);
        return ret;
    }

    async nearbyPcGenes() {
        const coord = await this.coord();
        if (!this.genesAll || !this.genesPC) {
            const { genesAll, genesPC } = await DbCommon.creGenes(this.assembly, this.accession, coord.chrom);
            this.genesAll = genesAll;
            this.genesPC = genesPC;
        }
        const ret: Array<any> = [];
        for (const g of this.genesPC) {
            ret.push({
                'name': g['approved_symbol'],
                'distance': g['distance'],
                'ensemblid_ver': g['ensemblid_ver'],
                'chrom': g['chrom'],
                'start': g['start'],
                'stop': g['stop']
            });
        }
        return ret;
    }

    async genesInTad() {
        if ('mm10' == this.assembly) {
            return [];
        }
        const coord = await this.coord();
        const rows = await DbCommon.genesInTad(this.assembly, this.accession, coord.chrom);
        const c = cache(this.assembly);
        const lookup = c.geneIDsToApprovedSymbol;
        const ret: Array<any> = [];
        for (const r of rows) {
            for (const g of r['geneids']) {
                ret.push({'name': lookup[g]});
            }
        }
        return ret;
    }

    async cresInTad() {
        if ('mm10' == this.assembly) {
            return [];
        }
        const coord = await this.coord();
        return DbCommon.cresInTad(this.assembly, this.accession, coord.chrom, coord.start);
    }

    async intersectingSnps(halfWindow) {
        return DbCommon.intersectingSnps(this.assembly, this.accession, await this.coord(), halfWindow);
    }

    async distToNearbyCREs(halfWindow) {
        return DbCommon.distToNearbyCREs(this.assembly, this.accession, await this.coord(), halfWindow);
    }

    async peakIntersectCount(eset) {
        const c = cache(this.assembly);
        return DbCommon.peakIntersectCount(this.assembly, this.accession, c.tfHistCounts[eset], eset);
    }
}

export async function resolve_credetails(source, args, context, info) {
    const accessions: string[] = args.accessions;
    return accessions.map(async (accession) => {
        const assembly = getAssemblyFromCre(accession);
        if (!assembly) {
            throw new UserError('Invalid accession: ' + accession);
        }
        const cre = new CRE(assembly, accession);
        const coord = await cre.coord();
        if (!coord) {
            throw new UserError('Invalid accession: ' + accession);
        }
        return { cre };
    });
}

export async function resolve_cre_info(source, args, context, info) {
    const cre: CRE = source.cre;
    const c = cache(cre.assembly);
    const res = await DbCreTable.getCreTable(cre.assembly, c.ctmap, {accessions: [cre.accession]}, {});
    if (res['total'] > 0) {
        return mapcre(cre.assembly, res['cres'][0]);
    }
    return {};
}

export async function resolve_cre_topTissues(source, args, context, info) {
    const cre: CRE = source.cre;
    return cre.topTissues();
}

export async function resolve_cre_nearbyGenomic(source, args, context, info) {
    const cre: CRE = source.cre;
    const accession = source.accession;
    const assembly = source.assembly;
    const coord = source.coord;

    const snps = await cre.intersectingSnps(10000);  // 10 KB
    const nearbyCREs = await cre.distToNearbyCREs(1000000);  // 1 MB
    const nearbyGenes = await cre.nearbyGenes();
    const genesInTad = await cre.genesInTad();
    const re_tads = await cre.cresInTad();

    return {
        'nearby_genes': nearbyGenes,
        'tads': genesInTad,
        're_tads': re_tads,
        'nearby_res': nearbyCREs,
        'overlapping_snps': snps
    };
}

export async function resolve_cre_fantomCat(source, args, context, info) {
    const cre: CRE = source.cre;
    const process = async (key) => {
        const results = await DbCreDetails.select_cre_intersections(cre.assembly, cre.accession, key);
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
        'fantom_cat': await process('intersection'),
        'fantom_cat_twokb': await process('twokbintersection')
    };
}

export async function resolve_cre_ortholog(source, args, context, info) {
    const cre: CRE = source.cre;
    const ortholog = await DbCreDetails.orthologs(cre.assembly, cre.accession);
    return { ortholog };
}

export async function resolve_cre_tfIntersection(source, args, context, info) {
    const cre: CRE = source.cre;
    return await cre.peakIntersectCount('peak');
}

export async function resolve_cre_cistromeIntersection(source, args, context, info) {
    const cre: CRE = source.cre;
    return await cre.peakIntersectCount('cistrome');
}

export async function resolve_cre_rampage(source, args, context, info) {
    const cre: CRE = source.cre;
    const nearbyGenes = await cre.nearbyPcGenes();
    const nearest = nearbyGenes.reduce((prev, curr) => !prev ? curr : (curr.distance < prev.distance ? curr : prev));
    return getByGene(cre.assembly, nearest);
}

export async function resolve_cre_linkedGenes(source, args, context, info) {
    const cre: CRE = source.cre;
    if ('mm10' === cre.assembly) {
        return [];
    }
    return {
        'linkedGenes': await DbCommon.linkedGenes(cre.assembly, cre.accession)
    };
}

export async function resolve_cre_tf_dcc(source, args, context, info) {
    const cre: CRE = source.cre;
    const target = args.target;
    const eset = args.eset;
    return await DbCommon.tfTargetExps(cre.assembly, cre.accession, target, eset);
}

export async function resolve_cre_histone_dcc(source, args, context, info) {
    const cre: CRE = source.cre;
    const target = args.target;
    const eset = args.eset;
    return await DbCommon.histoneTargetExps(cre.assembly, cre.accession, target, eset);
}

const minipeaks_host = 'http://screen.encodeproject.org/api/dataws/re_detail/miniPeaks';
// const minipeaks_host = 'http://screen.encodeproject.org/api/crews/re_detail/miniPeaks';
export async function resolve_cre_miniPeaks(source, args, context, info) {
    const cre: CRE = source.cre;
    const accession = cre.accession;
    const assembly = cre.assembly;
    const options = {
        method: 'POST',
        uri: minipeaks_host,
        body: {
            accession,
            assembly,
        },
        json: true
    };
    const res = await request(options);
    return res[accession].rows;
}
