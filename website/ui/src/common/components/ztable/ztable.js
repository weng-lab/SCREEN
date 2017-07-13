import React from 'react';

import SearchBar from './table/search/searchbar';
import ReactiveTable from './table/reactivetable';


import sortData from './table/sort/sortdata';
import generateRows from './table/tablecomponents/generaterows';
import generateHeaders from './table/tablecomponents/generateheaders';

class ZTable extends React.Component {

    constructor(props) {
      super(props);

      // initializes state of variable
      this.state = {
        activePage: 1, // active page for pagination
        activeSearchPage: 1, // active page for pagination with search
        value: '', // value in entered in search box
        columnSort: [], // condition for search
        columnSortType: [],
        searchCondition: false

      };

      // binds event handler
      this.handleSelect = this.handleSelect.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleClick = this.handleClick.bind(this);

    }


    render() {

      var data = this.props.data; // stores data to be entered in table


        var cols = this.props.cols, // [{key, label}]
          columnkey = this.props.columnkey,
          columnlabel = this.props.columnlabel,
          columnSort = this.state.columnSort;

      // value from search box
      var value = this.state.value;

      // divides pages in per_page for pagination
      const per_page = 10;

      // obtain the current page that user clicked on
      if (this.state.searchCondition)
        var current_page = this.state.activeSearchPage;
       else
        var current_page = this.state.activePage;

      // generates data by rows
      var fullData = generateRows(current_page, per_page, value, cols, data, columnkey);

        // generates header components
      var headerComponents = generateHeaders(this.handleClick, cols, columnkey, columnlabel, columnSort);

                // generates row components
      var rowComponents = fullData.colsData;
      var dataLength = fullData.dataLength;


      // error checks when all data are undefined
      if (dataLength == -1) {
        dataLength = 0;
        rowComponents = < tr > No matching records found. < /tr>;
      }

      // calculates total number of pages required for pagination
      var pages = Math.ceil(dataLength / per_page);

      // returns search box and result table
      return (
        <div>

<SearchBar value = {this.state.value} searchEvent = {this.handleChange}/>


<ReactiveTable headerComponents = {headerComponents}
rowComponents = {rowComponents}  pages = {pages}
current_page = { current_page }
pageChange = { this.handleSelect }
dataLength = {dataLength}/>

        </div>
        );
      }


      handleChange(e) {
        // sets current state of text entered on search box
        this.setState({ value: e.target.value });
        // case when search is true
        if (e.target.value != '') {
          this.setState({ searchCondition: true });
          // set active page for pagination to 1
          this.setState({ activeSearchPage: 1 });
        } else {
          this.setState({ searchCondition: false });
        }
      }

      handleSelect(eventKey) {
        // changes active page of pagination
        // for both cases when search is true
        // and when search is false
        if (this.state.searchCondition)
          this.setState({ activeSearchPage: eventKey });
         else
          this.setState({ activePage: eventKey });
      }


handleClick(columnKey) {
  // rerender if sorting is true
  this.setState({ columnSortType: [] });

  // checks whether columnSort is empty
  var condition = false;

  // variables for column sorting
  var columnSort = this.state.columnSort,
    columnSortType = this.state.columnSortType,
    data = this.props.data;

  // condition when columnSort is not empty,
  // rechecks array to modify value based on key
  if (data.length > 1) {
    if (columnSort.length > 0) {
      for (let i = 0; i < columnSort.length; i++) {


        // inactivates filtering
        Object.assign(columnSort[i], {
          sortOn: 'inactive'
        });

        // if columnKey found change column sorting direction
        if (columnSort[i].column == columnKey) {
          condition = true;

          // activates sorting
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

          Object.assign(columnSortType, columnSort[i]);

        }
      }
    }
    // case when columnSort is empty, push in new data
    if (!condition) {
      columnSort.push({
        column: columnKey,
        direction: 'asc',
        sortOn: 'active'
      });

      Object.assign(columnSortType,
        columnSort[columnSort.length - 1]);
    }

sortData(data, columnSortType, columnKey);

  }
}

    }
    export default ZTable;
