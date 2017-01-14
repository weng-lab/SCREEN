export const SET_CELL_TYPE = 'SET_CELL_TYPE';
export const setCellType = (cellType) => ({ type: SET_CELL_TYPE, cellType });

export const SET_CHROM = 'SET_CHROM';
export const setChrom = (chrom) => ({ type: SET_CHROM, chrom });

export const SET_COORDS = 'SET_COORDS';
export const setCoords = (start, end) => ({ type: SET_COORDS, start, end });

export const TOGGLE_TF = 'TOGGLE_TF';
export const toggleTf = (tf) => ({ type: TOGGLE_TF, tf });
export const SET_TFS_MODE = 'SET_TFS_MODE';
export const setTfsMode = (mode) => ({ type: SET_TFS_MODE, mode });

export const SET_ACCESSIONS = 'SET_ACCESSIONS'
export const setAccessions = (accs) => ({ type: SET_ACCESSIONS, accs });

export const SET_GENE_ALL_DISTANCE = 'SET_GENE_ALL_DISTANCE'
export const setGeneAllDistance = (start, end) => ({ type: SET_GENE_ALL_DISTANCE,
                                                     start, end });
export const SET_GENE_PC_DISTANCE = 'SET_GENE_PC_DISTANCE'
export const setGenePcDistance = (start, end) => ({ type: SET_GENE_PC_DISTANCE,
                                                     start, end });

export const SET_RANK_DNASE = 'SET_RANK_DNASE'
export const setRankDnase = (start, end) => ({ type: SET_RANK_DNASE,
                                                     start, end });
export const SET_RANK_PROMOTER = 'SET_RANK_PROMOTER'
export const setRankPromoter = (start, end) => ({ type: SET_RANK_PROMOTER,
                                                     start, end });
export const SET_RANK_ENHANCER = 'SET_RANK_ENHANCER'
export const setRankEnhancer = (start, end) => ({ type: SET_RANK_ENHANCER,
                                                     start, end });
export const SET_RANK_CTCF = 'SET_RANK_CTCF'
export const setRankCtcf = (start, end) => ({ type: SET_RANK_CTCF,
                                                     start, end });