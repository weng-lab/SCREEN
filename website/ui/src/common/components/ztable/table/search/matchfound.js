import searchRows from '../search/searchrows';
import searchItem from '../search/searchitem';

export default function matchFound(cols,
  columnkey, item, value, customSearch) {

  if (value == '') {
    return true;
  }

  let show_row = false;

  for (let i = 0; i < cols.length; i++) {
    var colData = cols[i];

    let columnName = colData[columnkey];

    // data value for per column
    let sic = searchItem(item,
        columnName, customSearch),
      search_item = sic.search_item,
      columnIndex = sic.columnIndex;

    // test condition if search is true
    show_row = searchRows(show_row, search_item, value,
      columnName, customSearch[columnIndex]);

    if (show_row)
      return true;
  }
  return show_row;
}
