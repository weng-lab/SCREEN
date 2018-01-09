export function resize(coord, halfWindow) {
    // 1-based coords for UCSC Genome Browser
    return {
        chrom: coord.chrom,
        start: Math.max(1, coord.start - halfWindow),
        end: coord.end + halfWindow,
    };
}

export function expanded(coord, halfWindow) {
    return {
        chrom: coord.chrom,
        start: Math.max(0, coord.start - halfWindow),
        end: coord.end + halfWindow,
    };
}

export function format(coord) {
    return `${coord.chrom}:${coord.start}-${coord.end}`;
}
