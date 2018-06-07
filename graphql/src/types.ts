export type Assembly = 'hg19' | 'mm10';
export type ChromRange = { chrom: string; start: number; end: number };
export type SNP = { assembly: Assembly; id: string; range: ChromRange };
export type assaytype = 'dnase' | 'h3k4me3' | 'h3k27ac' | 'ctcf';
