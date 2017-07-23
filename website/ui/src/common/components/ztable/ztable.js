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
    this.handleRowClicks = this.handleRowClicks.bind(this);
  }

  render() {

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
    const per_page = this.state.pageLimit;

    // obtain the current page that user had clicked
    if (this.state.searchCondition)
      var current_page = this.state.activeSearchPage;
    else
      var current_page = this.state.activePage;

    // generates header amd row components
    let headerComponents = generateHeaders(this.handleColumnClicks,
      cols, columnkey, columnlabel, columnSort);

    let rc = generateRows(this.handleRowClicks, rowClickedData, cols,
      columnkey, data, value, prevValue,
      searchedResultsIndex, current_page, per_page);

    // generates row components
    let rowComponents = rc.rowComponents,
      dataLength = rc.dataLength;

    let pages = Math.ceil(dataLength / per_page);

    // updates seached data, search data packages the searched results
    this.state.searchedResultsIndex = rc.searchedResultsIndex;
    this.state.prevValue = rc.prevValue;



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

<p id="demo"></p>

      < /
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

  handleRowClicks(rowIndex, columnIndex) {
    var onTdClick = this.props.onTdClick;

    this.setState({
      rowClickedData: this.props.data[rowIndex]
    });



if ("defaultContent" in this.props.cols[columnIndex]) {



}

  }


  handleColumnClicks(columnClicksKey) {
    // rerender if sorting is true
    this.setState({
      searchedResultsIndex: [],
      prevValue: undefined
    });


    let condition = false;

    // variables for column sorting
    let columnSort = this.state.columnSort,
      data = this.props.data;


    let columnSortType = [];

    // condition when columnSort is not empty,
    // rechecks array to modify value based on key
    if (data.length > 1) {
      if (columnSort.length > 0) {
        for (let i = 0; i < columnSort.length; i++) {

          // inactivates filtering
          if (columnSort[i].sortOn != 'disabled') {
            Object.assign(columnSort[i], {
              sortOn: 'inactive'
            });
          }

          if (typeof(columnClicksKey) == 'object') {

            if ("columnSort" in columnClicksKey) {

              var matchColumn = columnClicksKey["columnSort"];
              if (columnSort[i].column == matchColumn.column) {
                condition = true;
                // activates sorting
                if (columnSort[i].sortOn != 'disabled') {
                  Object.assign(columnSort[i], {
                    sortOn: 'active'
                  });

                  if (columnSort[i].direction == 'asc')
                    Object.assign(columnSort[i], {
                      direction: 'desc',
                    });
                  else
                    Object.assign(columnSort[i], {
                      direction: 'asc',
                    });
                }
                columnSortType = columnSort[i];
              }
            }
          } else {
            // if columnKey found change column sorting direction
            if (columnSort[i].column == columnClicksKey) {
              condition = true;

              // activates sorting
              if (columnSort[i].sortOn != 'disabled') {
                Object.assign(columnSort[i], {
                  sortOn: 'active'
                });

                if (columnSort[i].direction == 'asc')
                  Object.assign(columnSort[i], {
                    direction: 'desc',
                  });
                else
                  Object.assign(columnSort[i], {
                    direction: 'asc',
                  });
              }
              columnSortType = columnSort[i];
            }
          }
        }
      }

      // case when columnSort is empty, push in new data
      if (!condition) {
        if (typeof(columnClicksKey) === 'object') {
          if ("columnSort" in columnClicksKey) {
            columnSort.push(columnClicksKey["columnSort"]);
          }
        } else {
          if (typeof(data[0][columnClicksKey]) == 'string' ||
            typeof(data[0][columnClicksKey]) == 'number') {
            columnSort.push({
              column: columnClicksKey,
              direction: 'asc',
              sortOn: 'active'
            });
          } else {
            columnSort.push({
              column: columnClicksKey,
              direction: 'asc',
              sortOn: 'disabled'
            });
          }
        }

        columnSortType = columnSort[columnSort.length - 1];
      }
      // sorts data either by default or custom function
      if (columnSortType.customSort !== undefined &&
        columnSortType.customSort !== null) {
        customSort(data, columnSortType);
      } else {
        sortData(data, columnSortType);
      }
    }
  }
}
