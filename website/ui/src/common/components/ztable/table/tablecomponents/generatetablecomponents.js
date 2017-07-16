import generateRows from './generaterows';
import generateHeaders from './generateheaders';

export default function generateTableComponents(current_page,
  per_page, value, cols, data, searchedData,
  searchCondition, columnkey, columnlabel,
  columnSort, handleClick, customSearch) {
  // generates data by rows
  var fullData = generateRows(current_page,
    per_page, value, cols, data, searchedData,
    searchCondition, columnkey, customSearch);

  // generates header components
  var headerComponents = generateHeaders(handleClick,
    cols, columnkey, columnlabel, columnSort);

  // generates row components
  var rowComponents = fullData.rowComponents;
  searchedData = fullData.searchedData;
  var dataLength = fullData.dataLength;


  // error checks when all data are undefined
  if (dataLength == -1) {
    dataLength = 0;
    rowComponents = <tr> No matching records found. </tr>;
  }

  // calculates total number of pages required for pagination
  var pages = Math.ceil(dataLength / per_page);

  return {
    rowComponents,
    searchedData,
    headerComponents,
    dataLength,
    pages
  };

}
