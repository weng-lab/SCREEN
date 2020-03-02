import { db } from './db';
import { Assembly, ChromRange, SNP } from '../types';

export async function snptable(
    assembly: Assembly,
    range: ChromRange | undefined,
    id: string | undefined
): Promise<SNP[]> {
    const tableName = assembly + '_snps';
    const wherecond: string[] = [];
    const params: Record<string, any> = {};

    if (range) {
        wherecond.push(`chrom=$<chrom> AND start>=$<start> AND stop<=$<end>`);
        params.chrom = range.chrom;
        params.start = range.start;
        params.end = range.end;
    }
    if (id) {
        wherecond.push(`snp = $<id>`);
        params.id = id;
    }
    let retwhere = '';
    if (0 < wherecond.length) {
        retwhere = 'WHERE ' + wherecond.join(' and ');
    } else {
        retwhere = 'LIMIT 50';
    }
    const q = `
        SELECT snp,chrom,start,stop
        FROM ${tableName}
        ${retwhere}
    `;
    const res = await db.any(q, params);
    const response = res.map(row => ({
        assembly,
        id: row['snp'],
        range: {
            chrom: row['chrom'],
            start: row['start'],
            end: row['stop'],
        },
    }));

    return response;
}

export async function nearbygenes(assembly: Assembly, id: string): Promise<any> {
    const tableName = assembly + '_snps';
    const greaterq = `
select snp.id, snp.start as snpstart, snp.stop as snpstop, gene.approved_symbol, gene.ensemblid_ver, gene.start as genestart, gene.stop as genestop, gene.strand as genestrand, snp.chrom as chrom
from ${tableName} snp
inner join ${assembly}_gene_info gene on snp.chrom = gene.chrom and snp.start <= gene.stop
where snp.snp = $1
order by gene.start asc
limit 5
    `;
    const lesserq = `
select snp.id, snp.start as snpstart, snp.stop as snpstop, gene.approved_symbol, gene.ensemblid_ver, gene.start as genestart, gene.stop as genestop, gene.strand as genestrand, snp.chrom as chrom
from ${tableName} snp
inner join ${assembly}_gene_info gene on snp.chrom = gene.chrom and snp.stop >= gene.start
where snp.snp = $1
order by gene.start desc
limit 5
    `;
    type nearbygene = {
        id: string;
        chrom: string;
        snpstart: number;
        snpstop: number;
        genestart: number;
        genestop: number;
        genestrand: string;
        approved_symbol: string;
        ensemblid_ver: string;
    };
    const greatergenes = await db.any<nearbygene>(greaterq, [id]);
    const lessergenes = await db.any<nearbygene>(lesserq, [id]);
    const withdups = greatergenes
        .concat(lessergenes)
        .map(g => {
            let distance = 0;
            if (g.snpstop > g.genestart && g.snpstart < g.genestop) {
                distance = 0;
            } else if (g.snpstop < g.genestart) {
                distance = g.genestart - g.snpstop;
            } else if (g.snpstart > g.genestop) {
                distance = g.snpstart - g.genestop;
            } else {
                throw new Error('Bad logic.');
            }
            return {
                ...g,
                distance,
            };
        })
        .map(g => ({
            gene: {
                assembly,
                gene: g.approved_symbol,
                ensemblid_ver: g.ensemblid_ver,
                coords: {
                    chrom: g.chrom,
                    start: g.genestart,
                    end: g.genestop,
                    strand: g.genestrand,
                },
            },
            distance: g.distance,
        }))
        .sort((a, b) => a.distance - b.distance);
    const seen: any = {};
    const nodups = withdups.filter(item =>
        seen.hasOwnProperty(item.gene.gene) ? false : (seen[item.gene.gene] = true)
    );
    return nodups.slice(0, 5);
}
