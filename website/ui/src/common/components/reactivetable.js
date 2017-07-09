import React from 'react';
import GenerateColumns from './generatecolumns';
import GenerateRows from './generaterows';

import { Table, Pagination } from 'react-bootstrap';
import { Form, FormGroup, FormControl, Nav } from 'react-bootstrap';
import { Button, HelpBlock } from 'react-bootstrap';

class ReactiveTable extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        activePage: 1,
        activeSearchPage: 1,
        value: '',
        searchCondition: false

      };

      this.handleSelect = this.handleSelect.bind(this);
      this.getValidationState = this.getValidationState.bind(this);
      this.handleChange = this.handleChange.bind(this);

    }

    render() {
      
      var value = this.state.value;

      const per_page = 10;

      if (this.state.searchCondition) {
        var current_page = this.state.activeSearchPage;
      } else {
        var current_page = this.state.activePage;
      }

      var fullData = this.generateRows(current_page, per_page, value);
      var rowComponents = fullData.colsData;
      var dataLength = fullData.dataLength;


              if (dataLength == -1) {
dataLength = 0;
                rowComponents = <tr> No matching records found. </tr>;
              }


      var pages = Math.ceil(dataLength / per_page);

      return ( <div>
        <Nav pullRight>

        <Form inline>
        <FormGroup controlId = "formBasicText"
        //validationState={this.getValidationState()}
        > Search: < FormControl bsSize = "small"
        size = "15"
        type = "text"
        value = {
          this.state.value
        }
        onChange = {
          this.handleChange
        } /> <FormControl.Feedback/>

        </FormGroup> </Form> </Nav>

        <Table>
        <thead> { <GenerateColumns data = { this.props.data }
          cols = { this.props.cols }
          columnkey = { this.props.columnkey }
          columnlabel = { this.props.columnlabel }
          /> } 
          </thead> 
          <tbody> { rowComponents } </tbody>
          </Table>

          <Pagination className = "users-pagination pull-right"
          bsSize = "medium"
          maxButtons = { 3 }
          first last next prev boundaryLinks
          items = { pages }
          activePage = { current_page }
          onSelect = { this.handleSelect }/>

          <HelpBlock> Found { dataLength } result(s) </HelpBlock>

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
        this.setState({
          value: e.target.value
        });

        if (e.target.value != '') {
          this.setState({
            searchCondition: true
          });

          this.setState({
            activeSearchPage: 1
          });
          
        } else {
          
          this.setState({
            searchCondition: false
          });
        }
      }

      handleSelect(eventKey) {
        if (this.state.searchCondition) {
          this.setState({
            activeSearchPage: eventKey
          });
        } else {
          this.setState({
            activePage: eventKey
          });
        }
      }

      generateRows(current_page, per_page, value) {
        var cols = this.props.cols, // [{key, label}]
          data = this.props.data,
          columnkey = this.props.columnkey;

        var start_offset = (current_page - 1) * per_page;
        let start_count = 0;
        let count = 0;
        var final_count = -1;

        return {
          colsData: data.map(function(item, index) {
            
            var show_row = false;
            var condition = false;

            // handle the column data within each row
            var cells = cols.map(function(colData) {

              var columnData = colData[columnkey];

              switch (columnData) {
                case 'info':
///////////////////////////////////testing only
              var search_item = item[colData[columnkey]].accession;

              let search_index = 0;
              let value_index = 0;

              while (search_index < String(search_item).length) {


		if(show_row){search_index = String(search_item).length;}

                if (!isNaN(value) && value != 0 && !isNaN(search_item)) {

                  if ((-1 < Number(search_item) && Number(search_item) < 1) &&
                    (-1 < value && value < 1)) {

                    if (Number(search_item) > 0 && value > 0) {

                      if (String(search_item).charAt(0) == 0) {
                        search_index++;

                      }

                      if (value.charAt(0) == 0) {
                        value_index++;
                      }
                    }

                    if (Number(search_item) < 0 && value < 0) {
                      value_index++;
                      search_index++;
                      
                      if (String(search_item).charAt(1) == 0) {
                        search_index++;
                      }


                      if (value.charAt(1) == 0) {
                        value_index++;

                      }
                    }
                  }
                }


                if (value.substr(value_index, value.length).length + 
			search_index <= String(search_item).length) {

                  if (value.substr(value_index, value.length) == '' 
			|| value.substr(value_index, value.length).toLowerCase() 
			== String(search_item).toLowerCase().substr(search_index, 
			value.substr(value_index, value.length).length)) {
                    show_row = true;

                    if (value.substr(value_index, value.length).toLowerCase() 
			== String(search_item).toLowerCase().substr(search_index, 
			value.substr(value_index, value.length).length)) {
                      condition = true;

                    } else {
                      condition = false;

                    }
                    break;

                  }
                  
                } else {
                  break;

                }

                if (!isNaN(value) && value != 0 && !isNaN(search_item)) {

                  break;

                }
                search_index++;

              }
///////////////////////////////////testing only
                  return <td> <span> <a href = "https://www.w3schools.com/html/"> {
                    item[colData[columnkey]].accession
                  } </a> </span> </td>;
                case 'ctspecifc':
                  return <td>
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
                    </svg>
                    </td>;
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

              let search_index = 0;
              let value_index = 0;

	      var search_item = item[colData[columnkey]];

              while (search_index < String(search_item).length) {

		if(show_row){search_index = String(search_item).length;}


                if (!isNaN(value) && value != 0 && !isNaN(search_item)) {

                  if ((-1 < Number(search_item) && Number(search_item) < 1) ||
                    (-1 < value && value < 1)) {

                    if (Number(search_item) > 0 && value > 0) {

                      if (String(search_item).charAt(0) == 0) {
                        search_index++;

                      }

                      if (value.charAt(0) == 0) {
                        value_index++;
                      }
                    }

                    if (Number(search_item) < 0 && value < 0) {
                      value_index++;
                      search_index++;
                      
                      if (String(search_item).charAt(1) == 0) {
                        search_index++;
                      }


                      if (value.charAt(1) == 0) {
                        value_index++;

                      }
                    }
                  }
                }

                if (value.substr(value_index, value.length).length + 
			search_index <= String(search_item).length) {

                  if (value.substr(value_index, value.length) == '' 
			|| value.substr(value_index, value.length).toLowerCase() 
			== String(search_item).toLowerCase().substr(search_index, 
			value.substr(value_index, value.length).length)) {
                    show_row = true;

                    if (value.substr(value_index, value.length).toLowerCase() 
			== String(search_item).toLowerCase().substr(search_index, 
			value.substr(value_index, value.length).length)) {
                      condition = true;

                    } else {
                      condition = false;

                    }
                    break;

                  }
                  
                } else {
                  break;

                }

                if (!isNaN(value) && value != 0 && !isNaN(search_item)) {

                  break;

                }
                search_index++;

              }

              return <td> {
                search_item
              } </td>;
            });

            if (index == data.length - 1 && condition) {
              count++;

            }

            if (index == data.length - 1) {
              final_count = count;

              if (count == 0 || final_count == -1) {
		final_count = 0;
                return <tr> No matching records found. </tr>
              }

            }

            if (show_row) {
              count++;

              if (index >= start_offset && start_count < per_page) {
                start_count++;
                return <tr key = { item.id }> { cells } </tr>;
              }

            } else {
              start_offset++;

            }
          }), dataLength: final_count };
      }
    }

    export default ReactiveTable;
