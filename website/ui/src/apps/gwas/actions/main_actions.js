export const SET_GENOME_BROWSER_CTS = 'SET_GENOME_BROWSER_CTS';
export const setGenomeBrowserCelltypes = (list) => ({type: SET_GENOME_BROWSER_CTS, list});

export const TOGGLE_GENOME_BROWSER_CELLTYPE = 'TOGGLE_GENOME_BROWSER_CELLTYPE';
export const toggleGenomeBrowserCelltype = (ct) => ({
    type: TOGGLE_GENOME_BROWSER_CELLTYPE, ct});

export const SHOW_GENOME_BROWSER = 'SHOW_GENOME_BROWSER';
export const showGenomeBrowser = (cre, name, etype = null) => ({ type: SHOW_GENOME_BROWSER,
								 cre, name, etype});

export const SET_STUDY = 'SET_STUDY'
export const setStudy = (s) => ({ type: SET_STUDY, s });

export const SET_CELLTYPE = 'SET_CELLTYPE'
export const setCellType = (ct) => ({ type: SET_CELLTYPE, ct });

export const SET_GWAS_CELL_TYPES = 'SET_GWAS_CELL_TYPES'
export const setGwasCellTypes = (cts) => ({ type: SET_GWAS_CELL_TYPES, cts});

export const SET_GWAS_STUDY_TAB = 'SET_GWAS_STUDY_TAB'
export const setGwasStudyTab = (tab) => ({ type: SET_GWAS_STUDY_TAB, tab});

export const SET_MAIN_TAB = 'SET_MAIN_TAB';
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });

export const SHOW_RE_DETAIL = 'SHOW_RE_DETAIL';
export const showReDetail = (cre) => ({ type: SHOW_RE_DETAIL, cre})
export const SET_RE_DETAIL_TAB = 'SET_RE_DETAIL_TAB';
export const setReDetailTab = (name) => ({ type: SET_RE_DETAIL_TAB, name });
