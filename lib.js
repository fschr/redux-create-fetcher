const Fetcher = (actionPrefix, {
    fetchURLFunc,
    fetchOptionsFunc = key => ({ method: 'GET' }),
    responseType = 'json',
    parseResponse = value => value,
    verbose = false,
}) => {

    const requestAction = key => ({
        type: actionPrefix + '_REQUEST',
        key
    })

    const successAction = ({ key, result, ...stuff }) => ({
        type: actionPrefix + '_SUCCESS',
        key,
        result,
        ...stuff
    })

    const failureAction = ({ key, error, ...stuff }) => ({
        type: actionPrefix + '_FAILURE',
        key,
        error,
        ...stuff
    })


    return key => {
        return dispatch => {

            const dispatchSuccessAction = stuff => dispatch(successAction({ ...stuff, key }))
            const dispatchFailureAction = stuff => dispatch(failureAction({ ...stuff, key }))

            if (typeof actionPrefix !== 'string' ||
                typeof fetchURLFunc !== 'function') {
                console.error('Fetcher requires string `actionPrefix` and ' +
                              'function `fetchURLFunc` to be specified in ' +
                              'paramsFunc; got ' + actionPrefix + ' (type ' +
                              (typeof actionPrefix) + ') and (type ' +
                              (typeof fetchURLFunc) + '), respectively')
                return;
            }

	    dispatch(requestAction(key));

	    return fetch(fetchURLFunc(key), fetchOptionsFunc(key))
                .then(response => ({
                    value: response[responseType](),
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                }))
                .then( ({ value, ...stuff }) => {
                    let result = parseResponse(value);
                    if (typeof result.then === 'function') {
                        result
                            .then(result => dispatchSuccessAction({ ...stuff, result }))
                            .catch(error => dispatchFailureAction({  ...stuff, error: error.toString() }))
                    } else {
                        dispatchSuccessAction({ ...stuff, result })
                    }
                })
                .catch(error => dispatchFailureAction({ error: error.toString() }))
        }
    }
}

export default Fetcher;
