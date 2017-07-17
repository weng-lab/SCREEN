import revealSearchResults from '../search/revealsearchresults';
import generateSearchResults from '../search/generatesearchresults';

export default function generateRows(current_page,
  per_page, value, cols, data, searchedData,
  columnkey, customSearch) {

  let dataLength;
  let rowComponents;

  let start_offset = (current_page - 1) * per_page;

  let dataIndex = 0;
  if ((value != '' && current_page > 1 &&
      searchedData.length > 0) || value == '') {
    dataIndex = start_offset;
  }

  // case when active page of pagination greater than one
  // reveals required rows but does not search entire data set again
  if (value != '' && current_page > 1 &&
    searchedData.length > 0) {

    let searchResults = revealSearchResults(dataIndex,
      searchedData, start_offset, per_page);
    rowComponents = searchResults.rowComponents;
    dataLength = searchResults.dataLength;

    // case when data to be outputted needs to be
    // searched again
  } else {

    let searchResults = generateSearchResults(cols,
      columnkey, data, value, customSearch,
      dataIndex, start_offset, per_page);

    dataLength = searchResults.dataLength;
    rowComponents = searchResults.rowComponents;
    searchedData = searchResults.searchedData;
  }

  return {
    dataLength,
    rowComponents,
    searchedData
  };
}
