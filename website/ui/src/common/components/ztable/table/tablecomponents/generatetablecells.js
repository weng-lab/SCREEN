import searchRows from '../search/searchrows';
import searchItem from '../search/searchitem';


export default function generateTableCells(cols,
  columnkey, item, value, customSearch) {

  let show_row = false;


  for (let i = 0; i < cols.length; i++) {
    var colData = cols[i];

    let columnName = colData[columnkey];

    // data value for per column
    let sic = searchItem(item,
        columnName, colData, customSearch),
      search_item = sic.search_item,
      columnIndex = sic.columnIndex;

    // test condition if search is true
    let tc = searchRows(show_row, search_item, value,
      columnName, customSearch[columnIndex]);

    show_row = tc.show_row;


  }
  return show_row;

}
