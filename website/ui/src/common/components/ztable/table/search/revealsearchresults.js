export default function revealSearchResults(dataIndex,
  searchedData, start_offset, per_page) {

  let start_count = 0;
  let rowComponents = [];

  for (dataIndex; dataIndex < searchedData.length; dataIndex++) {
    if (dataIndex >= start_offset && start_count < per_page) {
      start_count++;
      rowComponents.push(searchedData[dataIndex]);
    }
  }

  let dataLength = searchedData.length;

  return {
    rowComponents,
    dataLength
  };

}
