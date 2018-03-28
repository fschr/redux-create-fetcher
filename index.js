'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var Fetcher = function Fetcher(actionPrefix, _ref) {
    var fetchURLFunc = _ref.fetchURLFunc,
        _ref$fetchOptionsFunc = _ref.fetchOptionsFunc,
        fetchOptionsFunc = _ref$fetchOptionsFunc === undefined ? function (key) {
        return { method: 'GET' };
    } : _ref$fetchOptionsFunc,
        _ref$responseType = _ref.responseType,
        responseType = _ref$responseType === undefined ? 'json' : _ref$responseType,
        _ref$parseResponse = _ref.parseResponse,
        parseResponse = _ref$parseResponse === undefined ? function (value) {
        return value;
    } : _ref$parseResponse,
        _ref$verbose = _ref.verbose,
        verbose = _ref$verbose === undefined ? false : _ref$verbose;


    var requestAction = function requestAction(key) {
        return {
            type: actionPrefix + '_REQUEST',
            key: key
        };
    };

    var successAction = function successAction(_ref2) {
        var key = _ref2.key,
            result = _ref2.result,
            stuff = _objectWithoutProperties(_ref2, ['key', 'result']);

        return _extends({
            type: actionPrefix + '_SUCCESS',
            key: key,
            result: result
        }, stuff);
    };

    var failureAction = function failureAction(_ref3) {
        var key = _ref3.key,
            error = _ref3.error,
            stuff = _objectWithoutProperties(_ref3, ['key', 'error']);

        return _extends({
            type: actionPrefix + '_FAILURE',
            key: key,
            error: error
        }, stuff);
    };

    return function (key) {
        return function (dispatch) {

            var dispatchSuccessAction = function dispatchSuccessAction(stuff) {
                return dispatch(successAction(_extends({}, stuff, { key: key })));
            };
            var dispatchFailureAction = function dispatchFailureAction(stuff) {
                return dispatch(failureAction(_extends({}, stuff, { key: key })));
            };

            if (typeof actionPrefix !== 'string' || typeof fetchURLFunc !== 'function') {
                console.error('Fetcher requires string `actionPrefix` and ' + 'function `fetchURLFunc` to be specified in ' + 'paramsFunc; got ' + actionPrefix + ' (type ' + (typeof actionPrefix === 'undefined' ? 'undefined' : _typeof(actionPrefix)) + ') and (type ' + (typeof fetchURLFunc === 'undefined' ? 'undefined' : _typeof(fetchURLFunc)) + '), respectively');
                return;
            }

            dispatch(requestAction(key));

            return fetch(fetchURLFunc(key), fetchOptionsFunc(key)).then(function (response) {
                return {
                    value: response[responseType](),
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                };
            }).then(function (_ref4) {
                var value = _ref4.value,
                    stuff = _objectWithoutProperties(_ref4, ['value']);

                var result = parseResponse(value);
                if (typeof result.then === 'function') {
                    result.then(function (result) {
                        return dispatchSuccessAction(_extends({}, stuff, { result: result }));
                    }).catch(function (error) {
                        return dispatchFailureAction(_extends({}, stuff, { error: error.toString() }));
                    });
                } else {
                    dispatchSuccessAction(_extends({}, stuff, { result: result }));
                }
            }).catch(function (error) {
                return dispatchFailureAction({ error: error.toString() });
            });
        };
    };
};

exports.default = Fetcher;
