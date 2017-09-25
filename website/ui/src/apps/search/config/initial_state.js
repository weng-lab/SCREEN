import MainTabInfo from './maintabs.js'
import {isCart} from '../../../common/utility'

const initialState = (search, globals) => {
    let pmaintab = null;
    let psubtab = null;
    if("maintab" in search){
	pmaintab = search.maintab;
        if("subtab" in search){
            psubtab = search.subtab;
        }
    }
    
    const parsedQuery = search.parsedQuery;
    
    let maintab = pmaintab || "results";
    let maintabs = MainTabInfo(parsedQuery);
    maintabs[maintab].visible = true;
    let maintab_visible = pmaintab ? true : isCart();

    let subtab = psubtab || "topTissues";
    let accession = null;
    
    if(parsedQuery["accessions"] &&
       1 === parsedQuery["accessions"].length){
        accession = parsedQuery["accessions"][0].toUpperCase();
    }

    return {
        rfacets: ["dnase", "promoter", "enhancer", "ctcf"],
        rank_dnase_start: 164, rank_dnase_end: 1000,
        rank_promoter_start: -1000, rank_promoter_end: 1000,
        rank_enhancer_start: -1000, rank_enhancer_end: 1000,
        rank_ctcf_start: -1000, rank_ctcf_end: 1000,
        gene_all_start: 0, gene_all_end: 5000000,
        gene_pc_start: 0, gene_pc_end: 5000000,
        ...parsedQuery,
        cart_accessions: new Set(parsedQuery["cart_accessions"]),
        tfs_selection: new Set(),
        tfs_mode: null,
        maintabs: maintabs,
        maintabs_active: maintab,
        maintabs_visible: maintab_visible,
        cre_accession_detail: accession,
	configuregb_cre: accession,
	configuregb_browser: null,
	configuregb_cts: globals.cellTypeInfoArr.map(x => ({
	    ...x,
	    checked: false
	})),
        active_cre: null,
        re_details_tab_active: subtab,
        tree_rank_method: "H3K27ac",
        tree_nodes_compare : null
    };
}

export default initialState;
