import generateRows from './generaterows';
import generateHeaders from './generateheaders';

export default function generateTableComponents(current_page,
  per_page, value, prevValue, cols, data, searchedResultsIndex,
  searchedDataLength, columnkey, columnlabel,
  columnSort, handleClick, customSearch) {

  // generates full data by rows
  let fd = generateRows(current_page,
    per_page, value, prevValue, cols, data,
    searchedResultsIndex, searchedDataLength,
    columnkey, customSearch);

  // generates row components
  let rowComponents = fd.rowComponents;
  searchedDataLength = fd.searchedDataLength;

  let dataLength;
  if(searchedDataLength != -1){
    dataLength = searchedDataLength;
  } else {
    dataLength = fd.dataLength;
  }
  searchedResultsIndex = fd.searchedResultsIndex;
  var prevValue = fd.prevValue;



  // generates header components
  let headerComponents = generateHeaders(handleClick,
    cols, columnkey, columnlabel, columnSort);

  // calculates total number of pages required for pagination
  let pages = Math.ceil(dataLength / per_page);

  return {
    rowComponents,
    searchedResultsIndex,
    searchedDataLength,
    headerComponents,
    dataLength,
    pages,
    prevValue
  };
}
