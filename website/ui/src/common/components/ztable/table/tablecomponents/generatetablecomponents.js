import generateRows from './generaterows';
import generateHeaders from './generateheaders';

export default function generateTableComponents(current_page,
  per_page, value, cols, data, searchedData,
  searchCondition, columnkey, columnlabel,
  columnSort, handleClick, customSearch) {
  // generates data by rows
  let fullData = generateRows(current_page,
    per_page, value, cols, data,
    searchedData, columnkey, customSearch);

  // generates row components
  let rowComponents = fullData.rowComponents,
    dataLength = fullData.dataLength;
  searchedData = fullData.searchedData;

  // generates header components
  let headerComponents = generateHeaders(handleClick,
    cols, columnkey, columnlabel, columnSort);

  // error checks when all data are undefined
  if (dataLength == -1) {
    dataLength = 0;
    rowComponents = < tr > No matching records found. < /tr>;
  }

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
