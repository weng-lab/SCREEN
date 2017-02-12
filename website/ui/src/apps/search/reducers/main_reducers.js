import * as Actions from '../actions/main_actions';
import * as SearchAction from '../../../common/actions/searchbox_actions.js'
import {doToggle} from '../../../common/utility'

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
        var ret = {...state, maintabs_active: action.name}
        ret.maintabs = {...state.maintabs};
        ret.maintabs[action.name].visible = true;
        return ret;

    case Actions.SHOW_RE_DETAIL:
        return {...state, cre_accession_detail: action.accession};
    case Actions.SET_RE_DETAIL_TAB:
        return {...state, re_details_tab_active: action.name};

    case Actions.TOGGLE_CART: {
	let n_accessions = doToggle(state.cart_accessions, action.accession);
	$.ajax({
            type: "POST",
            url: "/setCart",
            data: JSON.stringify(n_accessions),
            dataType: "json",
            contentType: "application/json",
            success: (response) => {}
	});

        return { ...state, cart_accessions: n_accessions}
    }

    case Actions.SET_TREE_RANK_METHOD: {
	return { ...state, tree_rank_method : action.tree_rank_method};
    }

    case Actions.SET_TREE_NODES_COMPARE: {
        return { ...state, tree_nodes_compare : [action.left, action.right] };
    }

    case SearchAction.MAKE_SEARCH_QUERY:
	// TODO: avoid the full page refresh
	var q = $.param({q : action.q,
			 assembly: GlobalAssembly});
	var arr = window.location.href.split("/");
	var host = arr[0] + "//" + arr[2];
	window.location = host + "/" + "search?" + q;
        return state;

    default:
      return state;
  }
};

export default main_reducers;
