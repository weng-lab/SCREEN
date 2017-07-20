import revealSearchResults from '../search/revealsearchresults';
import generateSearchResults from '../search/generatesearchresults';

export default function generateRows(current_page,
  per_page, value, prevValue, cols, data,
  searchedResultsIndex, searchedDataLength, columnkey, customSearch) {

  let dataLength;
  let rowComponents;
  // offset for pagination
  let start_offset = (current_page - 1) * per_page;

  // case when search condition not true
  // skips data before active page
  let dataIndex = 0;


  if (value == '') {
    searchedResultsIndex = [];
    searchedDataLength = -1;
    dataIndex = start_offset;
  }

  if (value != '' && prevValue == value &&
    searchedResultsIndex.length > 0) {
    start_offset = searchedResultsIndex[current_page - 1];
    dataIndex = start_offset;

  }


  let sr = generateSearchResults(cols,
    columnkey, data, value, prevValue, customSearch, searchedResultsIndex, searchedDataLength,
    dataIndex, start_offset, per_page);
  dataLength = sr.dataLength;

  rowComponents = sr.rowComponents;

  if (value != '' && prevValue != value) {
    searchedResultsIndex = sr.searchedResultsIndex,
      searchedDataLength = sr.searchedDataLength;
  }
  prevValue = value;


  return {
    dataLength,
    searchedDataLength,
    rowComponents,

    searchedResultsIndex,
    prevValue
  };
}
