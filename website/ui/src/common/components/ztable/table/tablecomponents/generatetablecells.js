import searchRows from '../search/searchrows';
import searchItem from '../search/searchitem';

export default function generateTableCells(cols,
  columnkey, item, value, customSearch) {

  let show_row = false;

  return {
    cells: cols.map(function(colData) {
      let columnName = colData[columnkey];

      // data value for per column
      let sic = searchItem(item,
          columnName, customSearch),
        search_item = sic.search_item,
        columnIndex = sic.columnIndex;

      // test condition if search is true
      let tc = searchRows(show_row, search_item, value,
        columnName, customSearch[columnIndex]);

      show_row = tc.show_row;

      // if data cannot be outputted, returns blank
      if (typeof(search_item) == 'object') {
        return <td > {} < /td>;
      }
      // return data per row and column
      if (!isNaN(search_item) &&
        !isNaN(search_item)) {


search_item = (search_item).toLocaleString();


        }

      return <td > { search_item } </td>;
    }),
    show_row,
  };
}
