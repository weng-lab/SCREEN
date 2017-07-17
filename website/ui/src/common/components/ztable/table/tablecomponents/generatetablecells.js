import searchRows from '../search/searchrows';
import searchItem from '../search/searchitem';

export default function generateTableCells(cols,
  columnkey, item, value, customSearch) {

  let show_row = false,
    foundSearchItem = false;

  return {
    cells: cols.map(function(colData) {
      let columnName = colData[columnkey];

      // data value for per column
      let searchItemComponents = searchItem(item,
          columnName, customSearch),
        search_item = searchItemComponents.search_item,
        columnIndex = searchItemComponents.columnIndex;

      // test condition if search is true
      let testCondition = searchRows(show_row,
        foundSearchItem, search_item, value,
        columnName, customSearch[columnIndex]);

      show_row = testCondition.show_row;
      foundSearchItem = testCondition.foundSearchItem;

      // if data cannot be outputted, returns blank
      if (typeof(search_item) == 'object') {
        return <td > {} < /td>;
      }
      // return data per row and column
      return <td > { search_item } </td>;
    }),
    show_row,
    foundSearchItem
  };
}
