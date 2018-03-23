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

    const successAction = ({ key, result, response }) => ({
        type: actionPrefix + '_SUCCESS',
        key,
        result,
        response
    })

    const failureAction = ({ key, error, response }) => ({
        type: actionPrefix + '_FAILURE',
        key,
        error,
        response
    })


    return key => {
        return dispatch => {

            const dispatchSuccessAction = ({ result, response }) => dispatch(successAction({ key, result, response }))
            const dispatchFailureAction = ({ error, response }) => dispatch(failureAction({ key, error, response }))

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
                .then(response => { value: response[responseType](), response })
                .then( ({ value, response }) => {
                    let result = parseResponse(value);
                    if (typeof result.then === 'function') {
                        result
                            .then(result => dispatchSuccessAction({ result, response }))
                            .catch(error => dispatchFailureAction({ error: error.toString(), response }))
                    } else {
                        dispatchSuccessAction({ result, response })
                    }
                })
                .catch(error => dispatchFailureAction({
                    error: error.toString(),
                    response: 'no response (request failed)'
                }))
        }
    }
}

export default Fetcher;
