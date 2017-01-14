import {obj_assign, obj_remove, array_remove, array_insert, array_contains} from '../../../common/common'
import SearchBoxReducer from '../../../common/reducers/searchbox'
import ExpressionMatrixReducer from './expression_matrix_reducer'

import {tissue_label_formatter} from '../config/colors'

import {tree_connector} from '../components/tree'
import {tss_connector} from '../components/tss'
import {minipeaks_connector} from '../components/minipeaks'

export const ADD_FACETBOX = 'ADD_FACETBOX';
export const FACETBOX_ACTION = 'FACETBOX_ACTION';
export const RESULTS_FETCHING = 'RESULTS_FETCHING';
export const RESULTS_DONE = 'RESULTS_DONE';
export const RESULTS_ERROR = 'RESULTS_ERROR';

export const SEARCHBOX_ACTION = 'SEARCHBOX_ACTION';

export const ADD_RESULTS_DISPLAY = 'ADD_RESULTS_DISPLAY';
export const RESULTS_DISPLAY_ACTION = 'RESULTS_DISPLAY_ACTION';

export const CREATE_TABLE = 'CREATE_TABLE';
export const SET_TABLE_RESULTS = 'SET_TABLE_RESULTS';
export const TOGGLE_CART_ITEM = 'TOGGLE_CART_ITEM';
export const SET_TREE = 'SET_TREE';
export const SET_TREE_FIELDS = 'SET_TREE_FIELDS';

export const EXPRESSION_MATRIX_ACTION = 'EXPRESSION_MATRIX_ACTION';

export const DETAILS_FETCHING = 'DETAILS_FETCHING';
export const DETAILS_DONE = 'DETAILS_DONE';
export const UPDATE_DETAIL = 'UPDATE_DETAIL';
export const SET_DETAIL_TAB = 'SET_DETAIL_TAB';

export const UPDATE_EXPRESSION_BOXPLOT = 'UPDATE_EXPRESSION_BOXPLOT';
export const EXPRESSION_BOXPLOT_LOADING = 'EXPRESSION_BOXPLOT_LOADING';
export const EXPRESSION_BOXPLOT_DONE = 'EXPRESSION_BOXPLOT_DONE';

export const TREE_COMPARISON_DONE = 'TREE_COMPARISON_DONE';
export const SET_TREE_COMPARISON = 'SET_TREE_COMPARISON';
export const TREE_COMPARISON_LOADING = 'TREE_COMPARISON_LOADING';

export const TAB_ACTION = 'TAB_ACTION';

export const UPDATE_COMPARISON = 'UPDATE_COMPARISON';

export const DO_NAV = 'DO_NAV';

export const default_state = (tabs) => {return {
    facet_boxes: {},
    tree_comparison: {
	left: [],
	right: []
    },
    results: {
	query: {},
	hits: [],
	order: [],
	columns: [],
	cart_list: [],
	total: 0,
	fetching: false,
	expression_boxplot: {
	    items: [],
	    gene_name: "",
	    fetching: false
	},
	tree: {
	    tree: null,
	    labels: null,
	    outer: "dnase",
	    inner: null,
	    label_formatter: tissue_label_formatter
	}
    },
    re_detail: {
	q: {
	    accession: "",
	    coord: {
		start: 0,
		end: 0,
		chrom: ""
	    }
	},
	data: {},
	expression_matrices: ExpressionMatrixReducer(),
	tab_selection: 0
    },
    main_tabs: tabs,
    comparison: {
	threshold: 1000,
	rank_type: "enhancer"
    },
    results_displays: {},
    searchbox: {
	value: ""
    }
}};

export const main_tss_connector = tss_connector(
    (state) => (state.results.expression_boxplot)
);

export const main_minipeaks_connector = minipeaks_connector(
    (state) => (state.re_detail.data.regions)
);

export const main_tree_connector = (store) => tree_connector(store)(
    (state) => (state.results.tree),
    (dispatch) => (dispatch)
);

export const get_root_reducer = (tabs) => (state = default_state(tabs), action) =>{
    if (null == action) {
        return state;
    }

    switch (action.type) {

    case SET_TREE_COMPARISON:
	return Object.assign({}, state, {
	    tree_comparison: Object.assign({}, state.tree_comparison, {
		left: action.response.tfs.left,
		right: action.response.tfs.right
	    })
	});

    case UPDATE_EXPRESSION_BOXPLOT:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_boxplot: action.expression_boxplot
	    })
	});

    case EXPRESSION_BOXPLOT_LOADING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_boxplot: Object.assign({}, state.results.expression_boxplot, {
		    fetching: true
		})
	    })
	});

    case EXPRESSION_BOXPLOT_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		expression_boxplot: Object.assign({}, state.results.expression_boxplot, {
		    fetching: false
		})
	    })
	});

    case ADD_FACETBOX:
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, {
		visible: action.visible,
		title: action.title,
		facets: action.facets,
		display_map: action.display_map
	    })
	});

    case SET_TREE_FIELDS:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		tree: Object.assign({}, state.results.tree, {
		    outer: action.outer,
		    inner: action.inner
		})
	    })
	});

    case DO_NAV:
	window.location.href = action.url + "?q=" + state.searchbox.value
	    + '&' + "assembly=" + GlobalAssembly;
	return state;

    case EXPRESSION_MATRIX_ACTION:
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, state.re_detail, {
		expression_matrices: ExpressionMatrixReducer(state.re_detail.expression_matrices, action.subaction)
	    })
	});

    case RESULTS_DISPLAY_ACTION:
	if (!(action.key in state.results_displays)) return state;
	var n_item = state.results_displays[action.key].reducer(state.results_displays[action.key], action.subaction);
	return Object.assign({}, state, {
	    results_displays: obj_assign(state.results_displays, action.key, n_item)
	});

    case FACETBOX_ACTION:

	/*
	 *  pass this action on to the specified facetbox if it exists
	 */
	if (!(action.key in state.facet_boxes)){
            return state;
        }
	var n_item = FacetboxReducer(state.facet_boxes[action.key],
                                     action.subaction);
	return Object.assign({}, state, {
	    facet_boxes: obj_assign(state.facet_boxes, action.key, n_item)
	});

    case RESULTS_FETCHING:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: true
	    })
	});

    case ADD_RESULTS_DISPLAY:
	var n_rd = Object.assign({}, state.results_displays);
	n_rd[action.key] = action.results_display;
	return Object.assign({}, state, {
	    results_displays: n_rd
	});

    case RESULTS_ERROR:
	console.log("RESULTS_ERROR:", action.requestobj);

    case RESULTS_DONE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		fetching: false,
		total: action.results.results.total
	    })
	});

    case CREATE_TABLE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		columns: action.columns,
		order: action.order
	    })
	});

    case SET_TABLE_RESULTS:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		hits: action.hits
	    })
	});

    case SET_TREE:
	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		tree: Object.assign({}, state.results.tree, action.tree)
	    })
	});

    case TOGGLE_CART_ITEM:
	var n_cart_list =
            (array_contains(state.results.cart_list, action.accession)
	     ? array_remove(state.results.cart_list, action.accession)
	     : array_insert(state.results.cart_list, action.accession));

	return Object.assign({}, state, {
	    results: Object.assign({}, state.results, {
		cart_list: n_cart_list
	    })
	});

    case SEARCHBOX_ACTION:
	return Object.assign({}, state, {
	    searchbox: SearchBoxReducer(state[action.target], action.subaction)
	});

    case UPDATE_DETAIL:
	var em = ("expression_matrices" in action.response.data
		  ? Object.assign({}, ExpressionMatrixReducer(), {
		      loading: false,
		      matrices: action.response.data.expression_matrices
		  })
		  : state.re_detail.expression_matrices);
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, state.re_detail, {
		data: Object.assign({}, state.re_detail.data, action.response.data),
		expression_matrices: em,
		tab_selection: 0,
		q: action.response.q
	    })
	});

    case SET_DETAIL_TAB:
	return Object.assign({}, state, {
	    re_detail: Object.assign({}, state.re_detail, {
		tab_selection: action.tab_selection
	    })
	});

    case TREE_COMPARISON_DONE:
	var n_state = Object.assign({}, state);
	n_state["main_tabs"] = TabReducer(n_state["main_tabs"], {
	    type: 'SELECT_TAB',
	    selection: "gcompare"
	});
	return n_state;

    case TAB_ACTION:
	var n_state = Object.assign({}, state);
	n_state[action.target] = TabReducer(n_state[action.target], action.subaction);
	return n_state;

    }

    return state;

}
