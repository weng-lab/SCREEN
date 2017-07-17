import React from 'react';
import { Form, FormGroup, FormControl, Nav } from 'react-bootstrap';

class SearchBar extends React.Component {

  render() {
    let value = this.props.value, // value in entered in search box
      searchEvent = this.props.searchEvent;

    return (
      <Nav pullRight>
        <Form inline>
          <FormGroup
            controlId = "formBasicText"> Search:
            <FormControl bsSize = "small"
              size = "15"
              type = "text"
              value = { value }
              onChange = { searchEvent }/>
            <FormControl.Feedback/ >
          </FormGroup>
        </Form>
      </Nav>
    );
  }

}

export default SearchBar;
