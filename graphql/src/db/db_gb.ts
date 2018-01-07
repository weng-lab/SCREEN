const executeQuery = require('./db').executeQuery;

export async function genetable(assembly, chrom, start, end) {
    const tableName = assembly + '_gene_details';
    const q = `
        SELECT *
        FROM ${tableName}
        WHERE transcript_id IN (
            SELECT transcript_id from ${tableName}
            WHERE feature='transcript'
            AND seqname='${chrom}'
            AND ( int4range(${start}, ${end}) && int4range(startpos, endpos) )
        )
    `;
    const res = await executeQuery(q);
    const response: Array<object> = res.rows.map(row => ({
        'transcript_id': row['transcript_id'],
        'seqid': row['seqname'].trim(),
        'type': row['feature'],
        'start': row['startpos'],
        'end': row['endpos'],
        'strand': row['strand'].trim(),
        'exon_number': row['exon_number'],
        'parent': row['parent'],
    }));
    const transcript_id = '';
    const transcript_id_value = '';
    const result: Array<object> = [];
    const sorter = (a, b) => a['transcript_id'].localeCompare(b['transcript_id']);
    response.sort(sorter);
    // From https://stackoverflow.com/a/34890276
    const groupBy = (array, key) => array.reduce((groups, item) => {
        (groups[item[key]] = groups[item[key]] || []).push(item);
        return groups;
    }, {});
    const responseGroups = groupBy(response, 'transcript_id');
    for (const key of Object.keys(responseGroups)) {
        const value = responseGroups[key];
        const exons: Array<object> = [];
        let start = '';
        let end = '';
        let strand = '';
        let seqid = '';
        for (const i of value) {
            const gtype = i['type'];
            if (gtype == 'transcript') {
                start = i['start'];
                end = i['end'];
                strand = i['strand'];
                seqid = i['seqid'];
            }
            if (gtype === 'CDS' || gtype === 'exon') {
                exons.push(i);
            }
        }
        if (exons.length > 0) {
            result.push({
                'transcript_id': key,
                'seqid': seqid,
                'start': start,
                'end': end,
                'strand': strand,
                'values': exons,
            });
        }
    }
    return result;
}
