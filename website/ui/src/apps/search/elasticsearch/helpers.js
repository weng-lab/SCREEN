export const selected_cell_line = (state) => {
    var clf = state.facet_boxes.cell_lines.facets.cell_lines.state;
    return (clf.selection == null ? "" : clf.selection);
};

export const term_match = (field, value) => {
    var retval = {term: {}};
    retval.term[field] = value;
    return retval;
};
