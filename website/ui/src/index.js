import { createStore, applyMiddleware }  from 'redux';
import { Provider, connect } from 'react-redux';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, Link, withRouter } from 'react-router';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import * as checklist from './facets/checklist';
import * as range from './facets/range';
import * as list from './facets/list';
