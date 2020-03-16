import { Client } from 'pg';
import { db } from './db';
import { Assembly } from '../types';

export async function select_cre_intersections(assembly, acc, key) {
    const tableintersections = assembly + '_fantomcat_' + key;
    const tablegenes = assembly + '_fantomcat_genes';
    const q = `
        SELECT g.*, jsonb_build_object('chrom', g.chrom, 'start', g.start, 'end', g.stop, 'strand', g.strand) as range
        FROM ${tablegenes} AS g, ${tableintersections} as i
        WHERE i.geneid = g.geneid AND i.cre = $1
    `;
    return await db.any(q, [acc]);
}

const orthoAssemblies = {
    grch38: ['hg19', 'mm10'],
    mm10: ['grch38', 'hg19'],
};

export async function orthologs(
    thisassembly: Assembly,
    thisaccession: string,
    otherassembly: string
): Promise<
    { assembly: string; accession: string; range: { chrom: string; start: number; end: number } }[] | undefined
> {
    if (!orthoAssemblies[thisassembly].includes(otherassembly)) {
        throw new Error(`${otherassembly} is invalid. Current options: ${orthoAssemblies[thisassembly]}`);
        return undefined;
    }
    const tablename = `${thisassembly}_liftover_${otherassembly}`;
    const q = `
SELECT chrom, start, stop, otheraccession
FROM ${tablename}
WHERE thisaccession = $1
    `;
    const res = await db.any(q, [thisaccession]);
    return res.map(r => ({
        assembly: otherassembly,
        accession: r.otheraccession,
        range: {
            chrom: r.chrom,
            start: r.start,
            end: r.stop,
        },
    }));
}
