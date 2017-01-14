export const SET_CELL_TYPE = 'SET_CELL_TYPE';
export const setCellType = (cellType) => ({ type: SET_CELL_TYPE, cellType });

export const SET_CHROM = 'SET_CHROM';
export const setChrom = (chrom) => ({ type: SET_CHROM, chrom });

export const SET_COORDS = 'SET_COORDS';
export const setCoords = (start, end) => ({ type: SET_COORDS, start, end });

export const SET_ACCESSIONS = 'SET_ACCESSIONS'
export const setAccessions = (accs) => ({ type: SET_ACCESSIONS, accs });

export const SET_GENE_ALL_DISTANCE = 'SET_GENE_ALL_DISTANCE'
export const setGeneAllDistance = (start, end) => ({ type: SET_GENE_ALL_DISTANCE,
                                                     start, end });
export const SET_GENE_PC_DISTANCE = 'SET_GENE_PC_DISTANCE'
export const setGenePcDistance = (start, end) => ({ type: SET_GENE_PC_DISTANCE,
                                                     start, end });