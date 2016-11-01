export const CoordinateQueryMap = (key, facet, query) => {
    var ranges = [{}, {}];
    ranges[0]["position.start"] = {
	lte: facet.state.selection_range[1]
    };
    ranges[1]["position.end"] = {
	gte: facet.state.selection_range[0]
    };
    query.post_filter.bool.must.push({
	range: ranges[0]
    });
    query.post_filter.bool.must.push({
	range: ranges[1]
    });
};
