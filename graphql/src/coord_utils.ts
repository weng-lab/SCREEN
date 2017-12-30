export function expanded(coord, halfWindow) {
    return {
        chrom: coord.chrom,
        start: Math.max(0, coord.start - halfWindow),
        end: coord.end + halfWindow,
    };
}
