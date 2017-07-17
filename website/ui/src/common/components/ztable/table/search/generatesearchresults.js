import generateTableCells from '../tablecomponents/generatetablecells';

export default function generateSearchResults(cols,
  columnkey, data, value, customSearch,
  dataIndex, start_offset, per_page) {

  let start_count = 0,
    countRowsReturned = 0,
    dataLength = 0;

  // stores search results
  let rowComponents = [],
    searchedData = [];

  for (dataIndex; dataIndex < data.length; dataIndex++) {
    // data set to be outputted
    let item = data[dataIndex];

    // extracts cells in each row,
    // returns whether item found in list
    let cc = generateTableCells(cols,
      columnkey, item, value, customSearch);
    let cells = cc.cells,
      show_row = cc.show_row;

    // returns rows where pagination or search is true
    if (show_row) {
      dataLength++;
      // stores entire searched data
      if (value != '') {
        searchedData.push( <tr key = { item.id }>
          { cells } </tr>);
        }

        // sections off pages for pagination
        if (dataIndex >= start_offset && start_count < per_page) {
          start_count++;

          rowComponents.push( <tr key = { item.id }>
            { cells } </tr>);
          }
        } else {
          start_offset++;
        }
        // case search is false loop through data only
        // per page limit
        if (value == '') {
          if (start_count == per_page || dataIndex == data.length - 1) {
            dataLength = data.length;
            break;
          }
        }
      }
      if (dataLength == 0) {
        rowComponents.push( <tr> No matching records found. </tr>);
        }
        return {
          dataLength,
          rowComponents,
          searchedData
        };
      }
