import ifRationalIncreaseIndex from './isrational';

export default function searchRows(show_row,
      foundSearchItem, search_item, value, columnName, customSearch) {

      var search_index = 0; // index of value in table
      var value_index = 0; // index of value in search box

      // length of search item
      var searchLength = String(search_item).length;

      // cotinues to search items in table per row for a match
      while (search_index < searchLength) {

        if (columnName == customSearch.column
          && customSearch.filterSearch === 'disabled') {
          break;
        }

        // breaks out of condition if match already found in the row
        if (show_row)
          break;

        if (compareValue == '') {
          show_row = true;
          break;
        }

        // case when value is numberic, enter the loop only once
        if (!isNaN(value) && value != 0
          && !isNaN(search_item)) {

          var testCondition = ifRationalIncreaseIndex(
            search_item, value, search_index, value_index);

          // test condition of value is rational
          search_index = testCondition.search_index;
          value_index = testCondition.value_index;
        }

        // obtain substrings of both search value and value in the table
        var compareValue = value.substr(value_index,
          value.length).toLowerCase();
        var compareSearchItem =
          String(search_item).substr(search_index,
          compareValue.length).toLowerCase();

        // searches for matching value
        // moves along the length of the string value in the table
        // continues incremementing by 1 until at end of String
        if (compareValue.length + search_index <= searchLength) {

          if (compareValue == compareSearchItem) {
            // reveals column, found a match
            show_row = true;
            // found a match, error checks for when search is true
            foundSearchItem = true;
            break;
          }
        } else {
          break;
        }

        // if numeric loop through only once
        if (!isNaN(value) && value != 0
          && !isNaN(search_item))
            break;

        //increment search index of string
        search_index++;

      }
      // return search conditions, show_rows shows rowa with matching
      // values, foundSearchItem error checks for a match in the end
      return {
        show_row: show_row,
        foundSearchItem: foundSearchItem
      };
    }
