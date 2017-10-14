# Overview

## Introduction

[Redux](http://redux.js.org/) is a state management framework for 
JavaScript apps. Web apps often require dynamically fetching
resources. Web apps built with redux tend to request and merge
resources into the redux store in a very regular pattern. 
This pattern can be demonstrated with a simple example:

Suppose a developer is writing a web app which has users and each 
user has a list of friends. If the developer wishes to dynamically
fetch a list of friends associated to a given user, she will 
probably write three action creators---one to signify that an HTTP
request was made, one to signify that a response was successfully
parsed, and one to signify that an error occured. She will also
export a function which serves as the API to those action creators.

```
// actions.js
const fetchFriendsRequest = user => ({
    type: 'FETCH_FRIENDS_REQUEST',
    user
})

const fetchFriendsSuccess = ({ user, friends }) => ({
    type: 'FETCH_FRIENDS_SUCCESS,
    user,
    friends
})

const fetchFriendsFailure = ({ user, error }) => ({
    type: 'FETCH_FRIENDS_ERROR',
    user,
    error
})

// api.js
export const fetchFriends = user => {
    return dispatch => {
        dispatch(fetchFriendsRequest(user))
        return 
            fetch('/api/' + user + '/friends/')
            .then(response => response.json())
            .then(
                friends => dispatch(fetchFriendsSuccess({
                    user,
                    friends
                }))
            )
            .catch(
                error => dispatch(fetchFriendsError({
                    user,
                    error
                }))
            )
    }
}
```

In fact, anytime the developer wishes to dynamically fetch a 
resource and merge it into the state, she will probably write code
which follows this pattern: writing three action creators and 
exposing a single function as an interface to them.

**This leads to lots of boilerplate**. Specifically, the four 
functions all have the same prefix, the action creators almost
always take *keys* or *key-value pairs* (in the example, keys
are users and key-value pairs are `{user, friends}` and 
`{user, error}` objects), and the body of the exported function
always has the same structure.

## Solution: `redux-create-fetcher`

Much of the boilerplate in this paradigm can be removed. A function
can be written which encapsulates the three action creators---since
none of them are ever exported---and returns the exported function.

The resulting function is `Fetcher`, the default export of the
`redux-create-fetcher` package.

# Examples

The developer who wrote the code above could replace all of it with
this code:

```
export const fetchFriends = Fetcher(
    'FETCH_FRIENDS',
    () => ({
        fetchURLFunc: user => '/api/' + user + '/friends/'
    })
)
```

## Modifying the response before dispatching a success action

Suppose the developer wants to expose a function similiar to 
`fetchFriends`, but with the caveat that only friends whose names
start with the letter 'A' are packaged into the resulting success
action. `parseResponse` solves this problem:

```
export const fetchFriends = Fetcher(
    'FETCH_FRIENDS',
    () => ({
        fetchURLFunc: user => ('/api/' + user + '/friends/'),
        parseResponse: friends => friends.filter(f => f.name.startsWith('A')),
    })
)
```

## Expecting responses which aren't JSON

Suppose the developer now expects her /api/<user>/friends/ endpoint
to return data in some sort of binary format. `responseType` solves
this problem:

```
export const fetchFriends = Fetcher(
    'FETCH_FRIENDS',
    () => ({
        fetchURLFunc: user => ('/api/' + user + '/friends/'),
        responseType: 'blob',
        parseResponse: blob => friendsFromBlob(blob),
    })
)
```

## Deferring success actions

Suppose the developer does not wish to dispatch a 
success action immediately upon parsing a response from her
endpoint. A typical scenario would be that she wishes to create
a mugshot from data associated with a user and store this
created image in the redux store. This requires using the
`image.onload` callback, rather than immediately dispatching a
a success action containing a response from her endpoint.
`deferredSuccess` and `dispatchSuccessAction` solve this problem:

```
export const fetchTileImage = Fetcher(
    'FETCH_FRIENDS',
    dispatchSuccessAction => ({
        fetchURLFunc: user => ('/api/' + user + '/mugshot/'),
        responseType: 'blob',
        deferredSuccess: mugshotBlob => {
            let mugshotURL = URL.createObjectURL(mugshotBlob);
            let mugshot = new Image();
            mugshot.onload = () => {
                dispatchSuccessAction(mugshot)
            }
            mugshot.src = mugshotURL;
        }
    })
)
```

# API

`Fetcher` takes as input an `actionPrefix` and a `paramsFunc` and it
returns the desired fetch function.

## `actionPrefix`

`actionPrefix` is a string which is the prefix of the action type
associated with each of the three action creators generated by
`Fetcher`.

## `paramsFunc`

It is easiest to understand `paramsFunc` by first looking at an
example.

`paramsFunc` is a function which returns a dictionary of values
which serve as arguments to `Fetcher`. `Fetcher` uses these
values by destructuring them into another dictionary (lines 28-34):

```
            const {
                fetchURLFunc,
                fetchOptionsFunc = key => ({ method: 'GET' }),
                responseType = 'json',
                parseResponse = value => value,
                deferredSuccess = undefined
            } = paramsFunc(dispatchSuccessAction)
```

### `fetchURLFunc`

`fetchURLFunc` is a required argument. It is a function which takes
a *key* and returns the URL from which to fetch a resource.

### `fetchOptionsFunc`

`fetchOptionsFunc` is a function which takes a *key* and returns
options to pass into the call to `fetch` when fetching a resource.

### `responseType`

`responseType` specifies the type of response to expect. Valid 
values are `'arrayBuffer'`, `'blob'`, `'formData'`, `'json'`, and
`'text'`. `responseType` defaults to `'json'`.

### `parseResponse`

`parseResponse` is a function which takes as input an
`ArrayBuffer`, a `Blob`, a JSON Object, etc., depending on the
specified `responseType` and returns value which is then passed
into the success action creator. `parseResponse` defaults to the
identity function.

### `deferredSuccess`

`deferredSuccess` is a function which takes as input an
`ArrayBuffer`, a `Blob`, a JSON Object, etc., depending on the
specified `responseType`. This function can act on its input
however it chooses. In most cases, this function will somehow
parse its input and then pass it into `dispatchSuccessAction`:
`paramsFunc` also takes as input a function---
`dispatchSuccessAction`, which may be used to dispatch the
generated success action.
