import generateRows from './generaterows';
import generateHeaders from './generateheaders';

export default function generateTableComponents(current_page,
  per_page, value, cols, data, searchedData,
  searchCondition, columnkey, columnlabel,
  columnSort, handleClick, customSearch) {

  // generates full data by rows
  let fd = generateRows(current_page,
    per_page, value, cols, data,
    searchedData, columnkey, customSearch);

  // generates row components
  let rowComponents = fd.rowComponents,
    dataLength = fd.dataLength;
  searchedData = fd.searchedData;

  // generates header components
  let headerComponents = generateHeaders(handleClick,
    cols, columnkey, columnlabel, columnSort);


  // calculates total number of pages required for pagination
  let pages = Math.ceil(dataLength / per_page);

  return {
    rowComponents,
    searchedData,
    headerComponents,
    dataLength,
    pages
  };
}
