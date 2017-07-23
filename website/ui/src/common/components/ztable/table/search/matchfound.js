import searchRows from '../search/searchrows';

export default function matchFound(cols,
  columnkey, item, value) {

  if (value == '')
    return true;

  let show_row = false,
  filterSearch,
  colData,
  columnName,
  search_item;

  for (let i = 0; i < cols.length; i++) {

    colData = cols[i];
    columnName = colData[columnkey];
    search_item = item[columnName];

    filterSearch = false;
    if ("customSearch" in colData) {
      if (colData["customSearch"].value != '') {
        search_item = item[columnName][colData["customSearch"].value];
      }
      if (colData["customSearch"].filterSearch === false) {
        filterSearch = true;
      }
    }

    // test condition if search is true
    show_row = searchRows(show_row, search_item, value,
      columnName, filterSearch);

    if (show_row)
      return true;
  }
  return show_row;
}
