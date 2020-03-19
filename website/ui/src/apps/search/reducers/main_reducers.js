/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'
import {toParams, doToggle} from '../../../common/utility'

const mainTabSetter = (state, tabName) => {
    let ret = {maintabs_active: tabName};
    ret.maintabs = {...state.maintabs};
    ret.maintabs[tabName].visible = true;
    return ret;
}

const main_reducers = (state, action) => {
    switch (action.type) {

	case Actions.SET_CELL_TYPE: return {...state, cellType: action.cellType };
	case Actions.SET_CHROM: return {...state, coord_chrom: action.chrom };
	case Actions.SET_COORDS: return {...state, coord_start: action.start,
					 coord_end: action.end };
	case Actions.SET_MINIPEAKS_ASSAY: return {...state, minipeaks_assay: action.assay};
	case Actions.TOGGLE_TF: {
            return { ...state,
                     tfs_selection: doToggle(state.tfs_selection, action.tf)}
	}
	case Actions.SET_TFS_MODE: return { ...state, tfs_mode: action.mode};
	case Actions.SET_ACCESSIONS: return {...state, accessions: action.accs};

	case Actions.SET_RANK_DNASE: return {...state, rank_dnase_start: action.start, rank_dnase_end: action.end};
	case Actions.SET_RANK_PROMOTER: return {...state, rank_promoter_start: action.start, rank_promoter_end: action.end};
	case Actions.SET_RANK_ENHANCER: return {...state, rank_enhancer_start: action.start, rank_enhancer_end: action.end};
    case Actions.SET_RANK_CTCF: return {...state, rank_ctcf_start: action.start, rank_ctcf_end: action.end};

	case Actions.SET_GENOME_BROWSER_CTS: return {
	...state,
	configuregb_cts: [
	    ...action.list,
	    ...state.configuregb_cts.filter(x => !x.checked)
	]
    };

	case Actions.SET_CRE_TYPE: return {...state, element_type: action.element_type};

	case Actions.SET_GENE_ALL_DISTANCE:
            return {...state, gene_all_start: action.start, gene_all_end: action.end };
	case Actions.SET_GENE_PC_DISTANCE:
            return {...state, gene_pc_start: action.start, gene_pc_end: action.end };

	case Actions.SHOW_MAIN_TABS:
            return {...state, maintabs_visible: action.show };

	case Actions.SET_RFACETS:
	    return {...state, rfacets: action.rfacets};

	case Actions.SET_MAIN_TAB:
            return {...state, ...mainTabSetter(state, action.name)};

	case Actions.SHOW_GENOME_BROWSER:
	    let ret = {...state, ...mainTabSetter(state, "configgb"),
		       configuregb_cre: action.cre,
		       configuregb_type: action.etype ? action.etype : "cre",
		       configuregb_browser: action.name,
		       configuregb_cts: state.configuregb_cts.map(x => ({
			   ...x,
			   checked: x.checked || (x.cellTypeName && x.cellTypeName === state.cellType)
		       }))
		      };
	    return ret;

	case Actions.SELECT_CRE:
	    
	    if(state.gb_cres.accession===action.accession.accession){
        return {...state,
          gb_cres: {}}
		}
    else {
      return {...state,
		    gb_cres: action.accession}
    }


	case Actions.TOGGLE_GENOME_BROWSER_CELLTYPE:
	    return {...state,
		    configuregb_cts: state.configuregb_cts.map(x => ({
			    ...x, checked: (x.cellTypeName === action.ct) !== x.checked
		    }))
		   };

	case Actions.SHOW_RE_DETAIL:
            return {...state, ...mainTabSetter(state, "details"),
                    active_cre: action.cre,
                    cre_accession_detail: action.cre.accession,
            };
	case Actions.SET_RE_DETAIL_TAB:
            return {...state, re_details_tab_active: action.name};

	case Actions.SET_CART: {
            return { ...state, cart_accessions: action.accessions}
	}

	case Actions.SET_TREE_RANK_METHOD: {
	    return { ...state, tree_rank_method : action.tree_rank_method};
	}

	case Actions.SET_TREE_NODES_COMPARE: {
            return { ...state, tree_nodes_compare : [action.left, action.right] };
	}

    case Actions.TOGGLE_COMPARTMENT: {
        return { ...state,
                 compartments_selected: doToggle(state.compartments_selected,
                                                 action.c)}
    }

    case Actions.TOGGLE_BIOSAMPLE_TYPE: {
	const biosample_types_selected = doToggle(state.biosample_types_selected, action.bt);
        return { ...state, biosample_types_selected};
    }

	case SearchAction.MAKE_SEARCH_QUERY:
	    // TODO: avoid the full page refresh
	    const q = toParams({q : action.q,
				assembly: action.assembly});
	    var arr = window.location.href.split("/");
	    var host = arr[0] + "//" + arr[2];
	    window.location = host + "/search?" + q;
            return state;

	default:
	    return state;
    }
};

export default main_reducers;
