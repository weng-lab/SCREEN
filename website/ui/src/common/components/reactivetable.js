import React from 'react';
import GenerateColumns from './generatecolumns';
import GenerateRows from './generaterows';

import { Table, Pagination } from 'react-bootstrap';
import { Form, FormGroup, FormControl, Nav } from 'react-bootstrap';
import { Button, HelpBlock } from 'react-bootstrap';

class ReactiveTable extends React.Component {

    constructor(props) {
      super(props);

      // initializes state of variable
      this.state = {
        activePage: 1, // active page for pagination
        activeSearchPage: 1, // active page for pagination with search
        value: '', // value in entered in search box
        searchCondition: false, // condition for search
        sortDirection: true,
sortedData: [],

      };

      // binds event handler
      this.handleSelect = this.handleSelect.bind(this);
      this.getValidationState = this.getValidationState.bind(this);
      this.handleChange = this.handleChange.bind(this);



    }







    render() {

      // value from search box
      var value = this.state.value;

      // divides pages in per_page for pagination
      const per_page = 10;

      // obtain the current page that user clicked on
      if (this.state.searchCondition)
        var current_page = this.state.activeSearchPage;
       else
        var current_page = this.state.activePage;

        // generates header components
        var headerComponents = this.generateHeaders();

      // generates data by rows
      var fullData = this.generateRows(current_page, per_page, value);
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

        <Nav pullRight>
        <Form inline>
        <FormGroup controlId = "formBasicText"

        //validationState={this.getValidationState()}

        > Search: <FormControl bsSize = "small"
        size = "15"
        type = "text"
        value = { this.state.value }
        onChange = { this.handleChange }
        /> <FormControl.Feedback/>
        </FormGroup> </Form>
        </Nav>

        <Table>
        <thead> { headerComponents } </thead>
          <tbody> { rowComponents } </tbody>
          </Table>

          <Pagination className = "users-pagination pull-right"
          bsSize = "medium"
          maxButtons = { 3 }
          first last next prev boundaryLinks
          items = { pages }
          activePage = { current_page }
          onSelect = { this.handleSelect }
          />
          <HelpBlock> Found { dataLength } result(s) < /HelpBlock>

          </div>
        );
      }

      getValidationState() {
        const length = this.state.value.length;

        if (length > 10) return 'success';
        else if (length > 5) return 'warning';
        else if (length > 0) return 'error';

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


      generateHeaders() {
        var cols = this.props.cols, // [{key, label}]
          columnkey = this.props.columnkey,
          columnlabel = this.props.columnlabel,
          sortedData = this.state.sortedData;

        // generate our header (th) cell components
        return cols.map(function(colData, index) {
          return <th key = { colData[columnkey]} onClick={
            ()=>{ sortData(colData[columnkey], sortedData); }}>
            { colData[columnlabel] } </th>;
        });
      }

      generateRows(current_page, per_page, value) {
        var cols = this.props.cols, // stores column data
          data = this.props.data, // stores data to be entered in table
          columnkey = this.props.columnkey,
          sortedData = []; // stores column key value

        var start_offset = (current_page - 1) * per_page; // offset for pagination
        let start_count = 0; // start count for pagination, start_counts
                             // marks point to return search data
        let countRowsReturned = 0; // counts number of rows returned
        var finalRowCount = -1; // counts total number of rows returned

        return {
          // searches for data for value to be stored in table
          colsData: data.map(function(item, index) {

            // condition for searching
            var show_row = false;
            var foundSearchItem = false;

            // searches for column data within each row
            var cells = cols.map(function(colData) {

              var columnData = colData[columnkey];

                switch (columnData) {
                  case 'info':
                    ///////////////////////////////////testing only
                    var search_item = item[colData[columnkey]].accession;

                    var testCondition = searchRows(show_row, foundSearchItem, search_item, value);

                    show_row = testCondition.show_row;
                    foundSearchItem = testCondition.foundSearchItem;

                    ///////////////////////////////////testing only
                    return <td > < span > < a href = "https://www.w3schools.com/html/" > {
                      item[colData[columnkey]].accession
                    } < /a> </span > < /td>;
                  case 'ctspecifc':
                    return <td >
                      <
                      svg width = "50"
                    height = "50" >
                      <
                      rect x = "0"
                    y = "10"
                    width = "30"
                    height = "30"
                    stroke = "black"
                    fill = "transparent"
                    stroke-width = "5" / >
                      <
                      rect x = "30"
                    y = "10"
                    width = "30"
                    height = "30"
                    stroke = "black"
                    fill = "yellow"
                    stroke-width = "5" / >
                      <
                      /svg> < /
                      td > ;
                  case 'genesallpc':
                    return <td > pc: {
                      item[colData[columnkey]][1].map(function(colData) {
                        return <span > < a href = "https://www.w3schools.com/html/" > {
                          colData
                        } < /a>, </span > ;
                      })
                    } < br / > all: {
                      item[colData[columnkey]][0].map(function(colData) {
                        return <span > < a href = "https://www.w3schools.com/html/" > {
                          colData
                        } < /a>, </span > ;
                      })
                    } < /td>;
                  case 'in_cart':
                    if (item[colData[columnkey]])
                      return <td > < button type = "button" > - < /button></td > ;
                    return <td > < button type = "button" > + < /button> </td > ;
                  case 'genomebrowsers':
                    return <td > < button type = "button" > UCSC < /button> </td > ;
                  default:
                }

              // data value for per column
              var search_item = item[colData[columnkey]];

              // test condition of search is true
              var testCondition = searchRows(show_row, foundSearchItem, search_item, value);
              show_row = testCondition.show_row;
              foundSearchItem = testCondition.foundSearchItem;

              // return data per row and column
              return <td> { search_item } </td>;
            });

            // error checking in case at end of data stored
            // stores the final row count for when search condition
            // is true
            if (index == data.length - 1 && foundSearchItem)
              countRowsReturned++;

            // stores total count of rows returned
            if (index == data.length - 1) {
              finalRowCount = countRowsReturned;

              // in case records not found, prints error message
              if (countRowsReturned == 0 || finalRowCount == -1) {
                finalRowCount = 0;
                return <tr > No matching records found. < /tr>
              }
            }

            // returns rows where pagination or search is true
            if (show_row) {
              countRowsReturned++;

              // sections off pages for pagination
              if (index >= start_offset && start_count < per_page) {
                start_count++;
                return <tr key = { item.id } > { cells } < /tr>;
              }

            } else {
              start_offset++; // error checking, to fill in gaps in data
                              // during search, increments offset in
                              //case search is true

            }
          }),
          dataLength: finalRowCount, // returns row data/ final
                                   // count of rows returned
        };
      }
    }

    export default ReactiveTable;

    function sortData(n, data) {
      alert('column: ' + n);



    }


    // searches row values in table for match in search box
    function searchRows(show_row, foundSearchItem, search_item, value) {

      var search_index = 0; // index of value in table
      var value_index = 0; // index of value in search box

      // length of search item
      var searchLength = String(search_item).length;

      // cotinues to search items in table per row for a match
      while (search_index < searchLength) {

        if (show_row)
          break;

        if (compareValue == '') {
          show_row = true;
          break;
        }

        // case when value is numberic enter the loop only once
        if (!isNaN(value) && value != 0 && !isNaN(search_item)) {
          var testCondition = ifRationalIncreaseIndex(search_item, value, search_index, value_index);

          // test condition of value is rational
          search_index = testCondition.search_index;
          value_index = testCondition.value_index;
        }

        // obtain substrings of both search value and value in the table
        var compareValue = value.substr(value_index, value.length).toLowerCase();
        var compareSearchItem = String(search_item).substr(search_index,
          compareValue.length).toLowerCase();

        // searches for matching value
        // moves along the length of the string value in the table
        // continues incremementing by 1 until at end of String
        if (compareValue.length + search_index <= searchLength) {

          if (compareValue == compareSearchItem) {
            // reveals column, found a match
            show_row = true;
            // found a match, error checks for when search is true
            foundSearchItem = true;
            break;
          }
        } else {
          foundSearchItem = false;
          break;
        }

        // if numeric loop through only once
        if (!isNaN(value) && value != 0 && !isNaN(search_item))
          break;

        //increment search index of string
        search_index++;

      }
      // return search conditions, show_rows shows rowa with matching
      // values, foundSearchItem error checks for a match in the end
      return {
        show_row: show_row,
        foundSearchItem: foundSearchItem
      };
    }

    // check for rational numbers
    function ifRationalIncreaseIndex(search_item, value, search_index, value_index) {

      // if search value and value in table between -1 and 1 eliminate leading zeros
      if ((-1 < Number(search_item) && Number(search_item) < 1) &&
        (-1 < value && value < 1)) {

        // case number is positive
        if (Number(search_item) > 0 && value > 0) {
        if (String(search_item).charAt(0) == 0)
          search_index++;

        if (value.charAt(0) == 0)
          value_index++;

        }

        // case number is negative
        if (Number(search_item) < 0 && value < 0) {
          value_index++;
          search_index++;

          if (String(search_item).charAt(1) == 0)
            search_index++;

          if (value.charAt(1) == 0)
            value_index++;

        }
      }

      // returns index at start of decimal without leading zeros
      return { search_index: search_index, value_index: value_index };

    }
