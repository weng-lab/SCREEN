import {SET_RANGE} from '../../../common/reducers/slider.js'

export const CellTypeQueryMap = (key, facet, query) => {
    if (!("venn" in query.extras)) query.extras["venn"] = {};
    query.extras.venn.cell_types = [];
    facet.state.data.map((d) => {if (d.selected) query.extras.venn.cell_types.push(d.key.replace(/ /g, "_"))});
    query.extras.table_cell_types = [query.extras.venn.cell_types[0], query.extras.venn.cell_types[1]];
};

export const RankTypeQueryMap = (key, facet, query) => {
    if (!("venn" in query.extras)) query.extras["venn"] = {};
    query.extras.venn.rank_type = facet.state.selection;
};

export const RankThresholdQueryMap = (key, facet, query) => {
    if (!("venn" in query.extras)) query.extras["venn"] = {};
    query.extras.venn.rank_threshold = facet.state.value;
};

export const RankThresholdResultsMap = (key, facet, dispatch, results) => {
    dispatch({
	type: SET_RANGE,
	range: results.venn.rank_range
    });
};
