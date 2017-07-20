import searchItem from '../search/searchitem';
import renderHTML from 'react-render-html'

export default function packageColumnCells(cols, columnkey, item, customSearch) {
let cells = [];

    for (let i = 0; i < cols.length; i++) {
      var colData = cols[i];

      let columnName = colData[columnkey];

      let sic = searchItem(item,
          columnName, colData, customSearch),
        search_item = sic.search_item,
        columnIndex = sic.columnIndex;

      if (customSearch[columnIndex].renderOn !== 'disabled' &&
        customSearch[columnIndex].column == columnName) {
        if (customSearch[columnIndex].column === null) {
          search_item = colData.defaultContent;
        } else {

          search_item = colData.render(item[columnName]);

        }
      }

      // if data cannot be outputted, returns blank
      if (typeof(search_item) == 'object' ||
        customSearch[columnIndex].renderOn == 'disabled') {
        cells.push( < td > {} < /td>);
        }

        // return data per row and column
        if (!isNaN(search_item) &&
          !isNaN(search_item)) {
          search_item = (search_item).toLocaleString();
        }



        cells.push( < td > {
            search_item
          } < /td>);
        }

      return cells;
}
