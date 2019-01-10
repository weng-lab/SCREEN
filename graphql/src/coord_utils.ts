import { ChromRange } from './types';

export function resize(coord: ChromRange, halfWindow: number): ChromRange {
    // 1-based coords for UCSC Genome Browser
    return {
        assembly: coord.assembly,
        chrom: coord.chrom,
        start: Math.max(1, coord.start - halfWindow),
        end: coord.end + halfWindow,
    };
}

export function expanded(coord: ChromRange, halfWindow): ChromRange {
    return {
        assembly: coord.assembly,
        chrom: coord.chrom,
        start: Math.max(0, coord.start - halfWindow),
        end: coord.end + halfWindow,
    };
}

export function format(coord: ChromRange) {
    return `${coord.chrom}:${coord.start}-${coord.end}`;
}
