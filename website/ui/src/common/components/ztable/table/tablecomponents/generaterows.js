import searchRows from '../search/searchrows';

export default function generateRows(current_page, per_page, value, cols, data, columnkey) {


      var start_offset = (current_page - 1) * per_page; // offset for pagination
      let start_count = 0; // start count for pagination, start_counts
                           // marks point to return search data
      let countRowsReturned = 0; // counts number of rows returned
      var finalRowCount = -1; // counts total number of rows returned

      return {
        // searches for data for value to be stored in table
        colsData: data.map(function(item, index) {

          // condition for searching
          var show_row = false;
          var foundSearchItem = false;

          // searches for column data within each row
          var cells = cols.map(function(colData) {

///////////////////////////////////testing only
            var columnData = colData[columnkey];
            if (typeof(item[colData[columnkey]]) === 'object' )
            return <td> { } </td>;
///////////////////////////////////testing only

            // data value for per column
            var search_item = item[colData[columnkey]];


            // test condition of search is true
            var testCondition = searchRows(show_row,
              foundSearchItem, search_item, value);

            show_row = testCondition.show_row;
            foundSearchItem = testCondition.foundSearchItem;

            // return data per row and column
            return <td> { search_item } </td>;
          });

          // error checking in case at end of data stored
          // stores the final row count for when search condition
          // is true
          if (index == data.length - 1 && foundSearchItem)
            countRowsReturned++;

          // stores total count of rows returned
          if (index == data.length - 1) {
            finalRowCount = countRowsReturned;

            // in case records not found, prints error message
            if (countRowsReturned == 0 ||
              finalRowCount == -1) {
              finalRowCount = 0;
              return <tr > No matching records found. < /tr>
            }
          }

          // returns rows where pagination or search is true
          if (show_row) {
            countRowsReturned++;

            // sections off pages for pagination
            if (index >= start_offset && start_count < per_page) {
              start_count++;
              return <tr key = { item.id } > { cells } < /tr>;
            }

          } else {
            start_offset++; // error checking, to fill in gaps in data
                            // during search, increments offset in
                            //case search is true
          }
        }),
        dataLength: finalRowCount, // returns row data/ final
                                 // count of rows returned
      };
    }
