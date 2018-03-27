var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const Fetcher = (actionPrefix, {
    fetchURLFunc,
    fetchOptionsFunc = key => ({ method: 'GET' }),
    responseType = 'json',
    parseResponse = value => value,
    verbose = false
}) => {

    const requestAction = key => ({
        type: actionPrefix + '_REQUEST',
        key
    });

    const successAction = _ref => {
        let { key, result } = _ref,
            stuff = _objectWithoutProperties(_ref, ['key', 'result']);

        return _extends({
            type: actionPrefix + '_SUCCESS',
            key,
            result
        }, stuff);
    };

    const failureAction = _ref2 => {
        let { key, error } = _ref2,
            stuff = _objectWithoutProperties(_ref2, ['key', 'error']);

        return _extends({
            type: actionPrefix + '_FAILURE',
            key,
            error
        }, stuff);
    };

    return key => {
        return dispatch => {

            const dispatchSuccessAction = stuff => dispatch(successAction(_extends({}, stuff, { key })));
            const dispatchFailureAction = stuff => dispatch(failureAction(_extends({}, stuff, { key })));

            if (typeof actionPrefix !== 'string' || typeof fetchURLFunc !== 'function') {
                console.error('Fetcher requires string `actionPrefix` and ' + 'function `fetchURLFunc` to be specified in ' + 'paramsFunc; got ' + actionPrefix + ' (type ' + typeof actionPrefix + ') and (type ' + typeof fetchURLFunc + '), respectively');
                return;
            }

            dispatch(requestAction(key));

            return fetch(fetchURLFunc(key), fetchOptionsFunc(key)).then(response => ({
                value: response[responseType](),
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            })).then(_ref3 => {
                let { value } = _ref3,
                    stuff = _objectWithoutProperties(_ref3, ['value']);

                let result = parseResponse(value);
                if (typeof result.then === 'function') {
                    result.then(result => dispatchSuccessAction(_extends({}, stuff, { result }))).catch(error => dispatchFailureAction(_extends({}, stuff, { error: error.toString() })));
                } else {
                    dispatchSuccessAction(_extends({}, stuff, { result }));
                }
            }).catch(error => dispatchFailureAction({ error: error.toString() }));
        };
    };
};

export default Fetcher;
