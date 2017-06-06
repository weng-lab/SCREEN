export const SET_GENOME_BROWSER_CTS = 'SET_GENOME_BROWSER_CTS';
export const setGenomeBrowserCelltypes = (list) => ({type: SET_GENOME_BROWSER_CTS, list});

export const TOGGLE_GENOME_BROWSER_CELLTYPE = 'TOGGLE_GENOME_BROWSER_CELLTYPE';
export const toggleGenomeBrowserCelltype = (ct) => ({
    type: TOGGLE_GENOME_BROWSER_CELLTYPE, ct});

export const SHOW_GENOME_BROWSER = 'SHOW_GENOME_BROWSER';
export const showGenomeBrowser = (cre, name, etype = null) => ({ type: SHOW_GENOME_BROWSER,
								 cre, name, etype});

export const SET_MAIN_TAB = 'SET_MAIN_TAB';
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });
