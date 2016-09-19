export const selected_cell_line = (state) => {
    var clf = state.facet_boxes.cell_lines.facets.cell_lines.state;
    return clf.items[clf.selection].value;
}
