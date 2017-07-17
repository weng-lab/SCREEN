import searchRows from '../search/searchrows';
import searchItem from '../search/searchitem';

export default function generateRows(current_page,
  per_page, value, cols, data, searchedData,
  searchCondition, columnkey, customSearch) {

  var start_offset = (current_page - 1) * per_page; // offset for pagination
  let start_count = 0; // start count for pagination, start_counts
  // marks point to return search data
  let countRowsReturned = 0; // counts number of rows returned
  var dataLength = -1; // counts total number of rows returned
  var rowComponents = [];

  let dataIndex = 0;

  if((searchCondition && current_page > 1
    && searchedData.length > 0 ) || value == '') {
      dataIndex = start_offset;
    }

  // case when active page of pagination greater than one
  // reveals required rows but does not search entire data set again
  if (searchCondition && current_page > 1
    && searchedData.length > 0) {

    for (dataIndex; dataIndex < searchedData.length; dataIndex++) {
      if (dataIndex >= start_offset && start_count < per_page) {
        start_count++;
        rowComponents.push(searchedData[dataIndex]);
      }
    }

    dataLength = searchedData.length;

  // case when data to be outputted needs to be
  // searched again
  } else {
    searchedData = [];
    for (dataIndex; dataIndex < data.length; dataIndex++) {
      // data set to be outputted
      var item = data[dataIndex];

      // condition for searching
      var show_row = false;
      var foundSearchItem = false;

      // searches for column data within each row
      var cells = cols.map(function(colData) {

        var columnName = colData[columnkey];

        // data value for per column
        var searchItemComponents = searchItem(item,
          columnName, customSearch);
        var search_item = searchItemComponents.search_item;
        var columnIndex = searchItemComponents.columnIndex;

        // test condition if search is true
        var testCondition = searchRows(show_row,
          foundSearchItem, search_item, value,
          columnName, customSearch[columnIndex]);

        show_row = testCondition.show_row;
        foundSearchItem = testCondition.foundSearchItem;

        // if data cannot be outputted, returns blank
        if (typeof(search_item) == 'object') {
          return <td> {} </td>;
        }
        // return data per row and column
        return <td> { search_item } </td>;
      });

      // in case at end of data stored
      // stores the final row count for when search condition
      // is true
      if (dataIndex == data.length - 1 && foundSearchItem)
        countRowsReturned++;

      // stores total count of rows returned
      if (dataIndex == data.length - 1) {
        if (show_row) { countRowsReturned++; }
        dataLength = countRowsReturned;

        // in case records not found, prints error message
        if (countRowsReturned == 0 || dataLength == -1) {
          dataLength = 0;
          rowComponents.push( <tr> No matching records found. </tr>);
          if (searchCondition) {
          searchedData.push( <tr> No matching records found. </tr>);
        }
            }



          }

          // returns rows where pagination or search is true
          if (show_row) {
            countRowsReturned++;

            // stores entire searched data
            if (searchCondition) {

            searchedData.push(
              <tr key = { item.id }> { cells } </tr>);

            }
              // sections off pages for pagination
              if (dataIndex >= start_offset
                && start_count < per_page) {
                start_count++;

                rowComponents.push(
                  <tr key = { item.id }> { cells } </tr>);
                }
              } else {
                start_offset++; // increments off-set when
                          // when searched data is not found
              }

                if(value == '' && start_count == per_page) {
                  dataLength = data.length;
                  break;}
            }
          }

          return {
            dataLength,
            rowComponents,
            searchedData
          };
        }
