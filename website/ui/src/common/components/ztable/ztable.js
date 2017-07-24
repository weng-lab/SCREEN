import React from 'react';

import ReactiveTable from './table/reactivetable';
import generateRows from './table/tablecomponents/generaterows';
import generateHeaders from './table/tablecomponents/generateheaders';

import SearchBar from './table/searchbar';

import customSort from './table/sort/customsort';
import sortData from './table/sort/sortdata';

export default class ZTable extends React.Component {

  constructor(props) {
    super(props);

    // initializes state of variable
    this.state = {
      // pagination variables
      activePage: 1,
      activeSearchPage: 1, // when search is true
      pageLimit: 10,
      // variables for search box
      value: '',
      searchCondition: false,
      prevValue: undefined,
      searchedResultsIndex: [],
      rowClickedData: undefined,

      // variables for sorting
      columnSort: []
    };

    // binds event handler
    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleColumnClicks = this.handleColumnClicks.bind(this);
    this.handleCellClicks = this.handleCellClicks.bind(this);

  }

  render() {


console.log("key", this.props.key);
console.log("order", this.props.order);
console.log("columnDefs", this.props.columnDefs);
console.log("cvisibel", this.props.cvisible);
console.log("cols", this.props.cols);
console.log("key", this.props.key);
console.log("key", this.props.key);
console.log("key", this.props.key);



    let rowClickedData = this.state.rowClickedData;


    let data = this.props.data;
    let cols = this.props.cols,
      columnkey = this.props.columnkey,
      columnlabel = this.props.columnlabel;

    let columnSort = this.state.columnSort;

    let searchedResultsIndex = this.state.searchedResultsIndex,
      searchCondition = this.state.searchCondition,
      prevValue = this.state.prevValue;


    // value from search box
    let value = this.state.value;

    // divides pages in per_page for pagination
    if(this.props.pageLimit)
    var per_page = this.props.pageLimit;
    else
    var per_page = this.state.pageLimit;

    // obtain the current page that user had clicked
    if (this.state.searchCondition)
      var current_page = this.state.activeSearchPage;
    else
      var current_page = this.state.activePage;

    // generates header amd row components
    let hc = generateHeaders(this.handleColumnClicks,
      cols, columnkey, columnlabel, columnSort, data[0]);
    let headerComponents = hc.columnHeader,
      columnSortTypes = hc.columnSortTypes;


    let rc = generateRows(this.handleCellClicks, rowClickedData, cols,
      columnkey, columnlabel, data, value, prevValue,
      searchedResultsIndex, current_page, per_page);

    // generates row components
    let rowComponents = rc.rowComponents,
      dataLength = rc.dataLength;

    let pages = Math.ceil(dataLength / per_page);

    // updates seached data, search data packages the searched results
    this.state.searchedResultsIndex = rc.searchedResultsIndex;
    this.state.prevValue = rc.prevValue;
    if (columnSortTypes.length == cols.length) {
      this.state.columnSort = columnSortTypes;
    }


    // returns search box and result table
    return ( <
      div >
      <
      SearchBar value = {
        this.state.value
      }
      searchEvent = {
        this.handleChange
      }
      /> <
      ReactiveTable headerComponents = {
        headerComponents
      }
      rowComponents = {
        rowComponents
      }
      pages = {
        pages
      }
      current_page = {
        current_page
      }
      pageChange = {
        this.handleSelect
      }
      dataLength = {
        dataLength
      }
      />

      <
      p id = "demo" > < /p>

      <
      /
      div >
    );
  }

  handleChange(e) {
    // sets current state of text entered on search box
    this.setState({
      value: e.target.value
    });

    // case when search is true
    if (e.target.value != '') {
      this.setState({
        searchCondition: true,
        activeSearchPage: 1
      });
    } else {
      this.setState({
        searchCondition: false
      });
    }
  }

  handleSelect(eventKey) {

    if (this.state.searchCondition)
      this.setState({
        activeSearchPage: eventKey
      });
    else
      this.setState({
        activePage: eventKey
      });
  }

  handleCellClicks(rowIndex, columnIndex, columnkey) {
    var data = this.props.data[rowIndex];
    var cols = this.props.cols[columnIndex];

    var onTdClick = this.props.onTdClick;
    var onButtonClick = this.props.onButtonClick;
    var cart_img_click_handler = this.props.cart_img_click_handler;

    onTdClick(cols[columnkey], data);
    cart_img_click_handler(cols[columnkey], data);
    //onButtonClick(this, data);

  }

  handleColumnClicks(columnName, index) {
    // rerender if sorting is true
    this.setState({
      searchedResultsIndex: [],
      prevValue: undefined
    });

    let columnSort = this.state.columnSort,
      data = this.props.data,
      cols = this.props.cols;

    if (data.length > 1) {
      let columnSortType = [];
      if (columnSort.length > 0) {
        if (columnSort[index]['sortOn'] != 'disabled') {
          for (let i = 0; i < columnSort.length; i++) {
            if (columnSort[i]['sortOn'] != 'disabled') {
              Object.assign(columnSort[i], {
                sortOn: 'inactive'
              });
            }
          }
          columnSortType = columnSort[index];
          Object.assign(columnSort[index], {
            sortOn: 'active'
          });

          if (columnSortType["custumFunction"]) {
            customSort(data, columnSortType, columnName);
          } else {
            sortData(data, columnSortType, columnName);
          }
          if (columnSort[index].direction == 'asc') {
            Object.assign(columnSort[index], {
              direction: 'desc',
            });
          } else {
            Object.assign(columnSort[index], {
              direction: 'asc',
            });
          }
        }
      }
    }
  }
}
