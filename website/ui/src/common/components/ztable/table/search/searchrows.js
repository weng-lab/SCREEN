import ifRationalIncreaseIndex from './isrational';

export default function searchRows(show_row, search_item, value,
  columnName, filterSearch) {

  if (filterSearch)
    return show_row;

  let search_index = 0,
    value_index = 0,
    searchLength = String(search_item).length;

  // cotinues to search items in table per row for a match
  while (search_index < searchLength) {

    // case when value is numberic, enter the loop only once
    if (!isNaN(value) && value != 0 &&
      !isNaN(search_item)) {

      let tc = ifRationalIncreaseIndex(
        search_item, value, search_index, value_index);

      // test condition if value is rational
      search_index = tc.search_index;
      value_index = tc.value_index;

      var compareValue = value.substr(value_index,
        value.length);
      var compareSearchItem =
        String(search_item).substr(search_index,
          compareValue.length);

    } else {

      var compareValue = value.substr(value_index,
        value.length).toLowerCase();
      var compareSearchItem =
        String(search_item).substr(search_index,
          compareValue.length).toLowerCase();
    }

    if (compareValue.length + search_index <= searchLength) {
      if (compareValue == compareSearchItem) {
        // reveals column, found a match
        show_row = true;
        // found a match,
        break;
      }
    } else {
      break;
    }
    // if numeric loop through only once
    if (!isNaN(value) && value != 0 &&
      !isNaN(search_item))
      break;
    //increment search index of string
    search_index++;
  }
  // returns search condition
  return show_row;
}
