const Fetcher = (actionPrefix, {
    fetchURLFunc,
    fetchOptionsFunc = key => ({ method: 'GET' }),
    responseType = 'json',
    parseResponse = value => value,
}) => {

    const requestAction = key => ({
        type: actionPrefix + '_REQUEST',
        key
    })

    const successAction = ({ key, result }) => ({
        type: actionPrefix + '_SUCCESS',
        key,
        result
    })

    const failureAction = ({ key, error }) => ({
        type: actionPrefix + '_FAILURE',
        key,
        error
    })


    return key => {
        return dispatch => {

            const dispatchSuccessAction = result => dispatch(successAction({ key, result }))
            const dispatchFailureAction = error => dispatch(failureAction({ key, error }))

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
                .then(response => response[responseType]())
                .then(value => {
                    let result = parseResponse(value);
                    if (typeof result.then === 'function') {
                        result
                            .then(result => dispatchSuccessAction(result))
                            .catch(error => dispatchFailureAction(error))
                    } else {
                        dispatchSuccessAction(result)
                    }
                })
                .catch(error => dispatchFailureAction(error))
        }
    }
}

export default Fetcher;
