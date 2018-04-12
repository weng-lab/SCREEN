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
    
    /* globals.cellTypeInfoArr.forEach((e) => {
       if(!e.name){
       console.log(e)
       }
     * })*/
    
    const parsedQuery = search.parsedQuery;

    let maintab = pmaintab || "results";
    let maintabs = MainTabInfo(parsedQuery, globals);
    maintabs[maintab].visible = true;
    let maintab_visible = pmaintab ? true : isCart();

    let subtab = psubtab || "topTissues";
    let accession = null;

    if(parsedQuery["accessions"] &&
       1 === parsedQuery["accessions"].length){
        accession = parsedQuery["accessions"][0].toUpperCase();
    }

    return {
	uuid: search.uuid,
        rfacets: ["dnase", "promoter", "enhancer", "ctcf"],
        rank_dnase_start: 1.64, rank_dnase_end: 10.00,
        rank_promoter_start: -10, rank_promoter_end: 10,
        rank_enhancer_start: -10, rank_enhancer_end: 10,
        rank_ctcf_start: -10, rank_ctcf_end: 10,
        gene_all_start: 0, gene_all_end: 5000000,
        gene_pc_start: 0, gene_pc_end: 5000000,
        ...parsedQuery,
        cart_accessions: new Set(parsedQuery["cart_accessions"]),
        tfs_selection: new Set(),
        tfs_mode: null,
        maintabs: maintabs,
        maintabs_active: maintab,
        maintabs_visible: maintab_visible,

	compartments_selected: new Set(["cell"]),
	biosample_types_selected: new Set(globals.geBiosampleTypes),

      //  active_cre: null,
        cre_accession_detail: accession,

      	configuregb_cre: accession,
      	configuregb_browser: null,
      	configuregb_cts: globals.cellTypeInfoArr,

	gb_cres: {}, // set of accessions to show in GB, and their metadata

        re_details_tab_active: subtab,
        tree_rank_method: "H3K27ac",
        tree_nodes_compare : null
    };
}

export default initialState;
