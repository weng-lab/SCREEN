export default function revealSearchResults(dataIndex,
  searchedData, start_offset, per_page) {

  let start_count = 0;
  let rowComponents = [];

  // outputs rows in searched data per page
  for (dataIndex; dataIndex < searchedData.length; dataIndex++) {
    if (dataIndex >= start_offset && start_count < per_page) {
      start_count++;
      rowComponents.push(searchedData[dataIndex]);
    }

    // loop through only per page limit
    if (start_count == per_page - 1) {
      break;
    }
  }

  // stores num of rows found in search
  let dataLength = searchedData.length;

  return {
    rowComponents,
    dataLength
  };

}
