import generateTableCells from '../tablecomponents/generatetablecells';
import packageColumnCells from './packagecolumncells';


export default function generateSearchResults(cols,
  columnkey, data, value, prevValue, customSearch, searchedResultsIndex, searchedDataLength,
  dataIndex, start_offset, per_page) {

  let start_count = 0,
    countRowsReturned = 0,
    dataLength = 0;


  // stores search results
  let rowComponents = [];

  let cells = [];


  if ((value != '' && prevValue != value)) {
    searchedResultsIndex = [],
      searchedDataLength = -1;
  }



  for (dataIndex; dataIndex < data.length; dataIndex++) {
    // data set to be outputted
    let item = data[dataIndex];


    // extracts cells in each row,
    // returns whether item found in list
    let show_row = generateTableCells(cols,
      columnkey, item, value, customSearch);


    // returns rows where pagination or search is true
    if (show_row) {

      dataLength++;


      cells = packageColumnCells(cols, columnkey, item, customSearch);


      // stores entire searched data
      if (value != '' && (prevValue !== value || searchedResultsIndex.length == 0)) {
        //searchedData.push( <tr key = { item.id }>
        //  { cells } </tr>);

        if (dataLength == 1) {
          searchedResultsIndex.push(dataIndex);
          //console.log("index storage", searchedResultsIndex);
        } else if ((dataLength - 1) % per_page == 0) {
          searchedResultsIndex.push(dataIndex);
          //console.log("index storage increments", searchedResultsIndex);
        }
      }

      // sections off pages for pagination
      if (dataIndex >= start_offset && start_count < per_page) {
        start_count++;

        rowComponents.push( < tr key = {
            item.id
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
        if (start_count == per_page || dataIndex == data.length - 1) {
          dataLength = data.length;
          break;
        }
      } else if (prevValue == value) {
        if (start_count == per_page || dataIndex == data.length - 1) {

          break;
        }

      }
    }


    if (value != '' && prevValue !== value) {

      searchedDataLength = dataLength;
    }

    if (dataLength == 0) {
      rowComponents.push( < tr > No matching records found. < /tr>);
      }

      return {
        dataLength,
        searchedDataLength,
        rowComponents,
        searchedResultsIndex,

      };
    }
