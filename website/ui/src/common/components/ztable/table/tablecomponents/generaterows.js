import revealSearchResults from '../search/revealsearchresults';
import generateSearchResults from '../search/generatesearchresults';

export default function generateRows(current_page,
  per_page, value, prevValue, cols, data, searchedData,
  columnkey, customSearch) {

  let dataLength;
  let rowComponents;

  // offset for pagination
  let start_offset = (current_page - 1) * per_page;

  // case when search condition not true
  // skips data before active page
  let dataIndex = 0;
  if ((value != '' && prevValue == value &&
      searchedData.length > 0) || value == '') {
    dataIndex = start_offset;
  }

  // active page greater than one
  // reveals required rows but does not search data set again
  if (value != '' && prevValue == value &&
    searchedData.length > 0) {
    let sr = revealSearchResults(dataIndex,
      searchedData, start_offset, per_page);
    rowComponents = sr.rowComponents;
    dataLength = sr.dataLength;
    // data to be outputted is
    // searched again
  } else {
    let sr = generateSearchResults(cols,
      columnkey, data, value, customSearch,
      dataIndex, start_offset, per_page);

    dataLength = sr.dataLength;
    rowComponents = sr.rowComponents;
    searchedData = sr.searchedData;
    prevValue = value;
  }
  return {
    dataLength,
    rowComponents,
    searchedData,
    prevValue
  };
}
