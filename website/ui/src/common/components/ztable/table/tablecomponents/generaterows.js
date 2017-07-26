import matchFound from '../search/matchfound';
import packageColumnCells from '../search/packagecolumncells';

export default function generateRows(handleCellClicks, positionText, cols,
  columnkey, columnlabel, data, value, prevValue,
  searchedResultsIndex, current_page, per_page) {

  let start_count = 0,
    dataLength = 0,
    dataIndex = 0;

  let start_offset = (current_page - 1) * per_page,
    fullDataLength = data.length;

  if (value == '') {
    searchedResultsIndex = [];
    dataIndex = start_offset;
  } else {
    if (prevValue == value &&
      searchedResultsIndex.length > 0) {
      dataIndex = start_offset;
      fullDataLength = searchedResultsIndex.length;
    }
    if (prevValue != value) {
      searchedResultsIndex = [];
    }
  }

  // stores search results
  let cells = [],
    rowComponents = [],
    newSearchedResultsIndex = [];

  let rowIndex;

  for (dataIndex; dataIndex < fullDataLength; dataIndex++) {

    if (value != '' && prevValue == value &&
      searchedResultsIndex.length > 0) {
      var item = data[searchedResultsIndex[dataIndex]];
      rowIndex = searchedResultsIndex[dataIndex];
      var show_row = true;

    } else {
      // data set to be outputted
      var item = data[dataIndex];
      rowIndex = dataIndex;

      var show_row = matchFound(cols,
        columnkey, item, value);

    }
    // returns rows where pagination or search is true
    if (show_row) {
      dataLength++;

      // stores entire searched data
      if (value != '' && (prevValue !== value ||
          searchedResultsIndex.length == 0)) {
        newSearchedResultsIndex.push(dataIndex);
      }

      // sections off pages for pagination
      if (dataIndex >= start_offset && start_count < per_page) {
        start_count++;

        cells = packageColumnCells(handleCellClicks.bind(this,
            rowIndex), positionText, cols,
          columnkey, columnlabel, item);

        rowComponents.push( < tr key = {
            start_count
          } > {
            cells
          } < /tr>);
        }

      } else {
        start_offset++;
      }
      // case search is false loop through data only
      // per page limit
      if (value == '') {
        if (start_count == per_page || dataIndex == fullDataLength - 1) {
          dataLength = data.length;
          break;
        }
      } else if (prevValue == value) {
        if (start_count == per_page || dataIndex == fullDataLength - 1) {
          dataLength = fullDataLength;
          break;
        }
      }
    }

    if (value != '' && prevValue !== value) {
      searchedResultsIndex = newSearchedResultsIndex;
    }

    if (dataLength == 0) {
      rowComponents.push( < tr >
        No matching records found. <
        /tr>);

      }

      prevValue = value;

      return {
        dataLength,
        rowComponents,
        searchedResultsIndex,
        prevValue
      };
    }
