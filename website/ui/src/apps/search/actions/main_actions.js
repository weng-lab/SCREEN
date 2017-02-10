export const SET_CELL_TYPE = 'SET_CELL_TYPE';
export const setCellType = (cellType) => ({ type: SET_CELL_TYPE, cellType });

export const SET_CHROM = 'SET_CHROM';
export const setChrom = (chrom) => ({ type: SET_CHROM, chrom });

export const SET_COORDS = 'SET_COORDS';
export const setCoords = (start, end) => ({ type: SET_COORDS, start, end });

export const SET_CRE_TYPE = 'SET_CRE_TYPE';
export const setType = (element_type) => ({type: SET_CRE_TYPE, element_type});

export const TOGGLE_TF = 'TOGGLE_TF';
export const toggleTf = (tf) => ({ type: TOGGLE_TF, tf });
export const SET_TFS_MODE = 'SET_TFS_MODE';
export const setTfsMode = (mode) => ({ type: SET_TFS_MODE, mode });

export const SET_RFACETS = 'SET_RFACETS';
export const setrfacets = (rfacets) => ({type: SET_RFACETS, rfacets});

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

export const SHOW_MAIN_TABS = 'SHOW_MAIN_TABS'
export const showMainTabs = (show) => ({ type: SHOW_MAIN_TABS, show });
export const SET_MAIN_TAB = 'SET_MAIN_TAB'
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });

export const SET_MINIPEAKS_ASSAY = 'SET_MINIPEAKS_ASSAY';
export const setMiniPeaksAssay = (assay) => ({type: SET_MINIPEAKS_ASSAY, assay});

export const SHOW_RE_DETAIL = 'SHOW_RE_DETAIL'
export const showReDetail = (accession) => ({ type: SHOW_RE_DETAIL, accession})
export const SET_RE_DETAIL_TAB = 'SET_RE_DETAIL_TAB'
export const setReDetailTab = (name) => ({ type: SET_RE_DETAIL_TAB, name });

export const TOGGLE_CART = 'TOGGLE_CART'
export const toggleCart = (accession) => ({ type: TOGGLE_CART, accession });

export const SET_TREE_RANK_METHOD = 'SET_TREE_RANK_METHOD'
export const setTreeRankMethod = (tree_rank_method) => ({
    type: SET_TREE_RANK_METHOD, tree_rank_method });
export const SET_TREE_NODES_COMPARE = 'SET_TREE_NODES_COMPARE'
export const setTreeNodesCompare = (left, right) => ({
    type: SET_TREE_NODES_COMPARE, left, right })
