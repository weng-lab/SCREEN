import generateTableCells from '../tablecomponents/generatetablecells';

export default function generateSearchResults(cols, columnkey,
  data, value, customSearch, dataIndex, start_offset, per_page) {

  let start_count = 0,
    countRowsReturned = 0;

  let dataLength = -1;

  let rowComponents = [],
    searchedData = [];

  for (dataIndex; dataIndex < data.length; dataIndex++) {
    // data set to be outputted
    let item = data[dataIndex];

    let cc = generateTableCells(cols,
      columnkey, item, value, customSearch);
    let cells = cc.cells,
      show_row = cc.show_row,
      foundSearchItem = cc.foundSearchItem;

    if (dataIndex == data.length - 1 && foundSearchItem)
      countRowsReturned++;

    // stores total count of rows returned
    if (dataIndex == data.length - 1) {
      if (show_row) {
        countRowsReturned++;
      }
      dataLength = countRowsReturned;

      // in case records not found, prints error message
      if (countRowsReturned == 0 || dataLength == -1) {
        dataLength = 0;
        rowComponents.push( < tr > No matching records found. < /tr>);
          if (value != '') {
            searchedData.push( < tr > No matching records found. < /tr>);
            }
          }
        }

        // returns rows where pagination or search is true
        if (show_row) {
          countRowsReturned++;

          // stores entire searched data
          if (value != '') {
            searchedData.push( <tr key = { item.id }>
              { cells } </tr>);
            }
            // sections off pages for pagination
            if (dataIndex >= start_offset &&
              start_count < per_page) {
              start_count++;

              rowComponents.push( <tr key = { item.id }>
                { cells } </tr>);
              }

            } else {
              start_offset++; // increments off-set when
              // when searched data is not found
            }
            if (value == '' && start_count == per_page) {
              dataLength = data.length;
              break;
            }
          }
          return {
            dataLength,
            rowComponents,
            searchedData
          };
        }
