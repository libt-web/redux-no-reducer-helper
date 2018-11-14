'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getType(obj) {
    return Object.prototype.toString.call(obj).replace(/(\[object\W+|\])/g, '').toLowerCase();
}
function copyObj(obj) {
    var newData = {};
    if (getType(obj) == 'object') {
        newData = Object.assign({}, obj);
    } else if (getType(obj) == 'array') {
        newData = Object.assign([], obj);
    } else {
        throw new Error('can not use this action in this type: ' + obj);
    }
    return newData;
}
function calAction(oldValue, path) {
    if (path.__value__ !== undefined) {
        // 路径到达，更新数据
        if (getType(path.__value__) == 'function') {
            return path.__value__(oldValue);
        }
        return path.__value__;
    } else {
        // 复制更新路径中经历的数据节点
        var newData = copyObj(oldValue);
        Object.keys(path).forEach(function (key) {
            newData[key] = calAction(oldValue[key], path[key]);
        });
        return newData;
    }
}
function getPath(str) {
    return str.split('/');
}

var PathTree = function () {
    function PathTree() {
        _classCallCheck(this, PathTree);

        this.root = {};
    }

    _createClass(PathTree, [{
        key: 'setNewNode',
        value: function setNewNode(path, value) {
            var cursor = this.root;
            path.forEach(function (key, i) {
                if (cursor[key] === undefined) {
                    if (i < path.length - 1) {
                        cursor[key] = {};
                    } else {
                        cursor[key] = { __value__: value === undefined ? null : value };
                    }
                } else if (i >= path.length - 1) {
                    cursor[key].__value__ = value === undefined ? null : value;
                }
                cursor = cursor[key];
            });
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.root = {};
        }
    }]);

    return PathTree;
}();

var ImCursor = function () {
    function ImCursor(dispatch, getstate, actionType) {
        _classCallCheck(this, ImCursor);

        this.dispatch = dispatch;
        this.getstate = getstate;
        this.actionType = actionType;
        this.rootPath = [];
        this.actions = new PathTree();
    }

    _createClass(ImCursor, [{
        key: 'setRoot',
        value: function setRoot(pathStr) {
            if (pathStr === undefined) {
                this.rootPath = [];
                return;
            }
            this.rootPath = getPath(pathStr);
        }
    }, {
        key: 'set',
        value: function set(pathStr, value) {
            this.actions.setNewNode(this.rootPath.concat(getPath(pathStr)), value);
        }
    }, {
        key: 'update',
        value: function update(pathStr, value) {
            this.actions.setNewNode(this.rootPath.concat(getPath(pathStr)), value);
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.actions.clear();
        }
    }, {
        key: 'call',
        value: function call() {
            var _this = this;

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            if (args.length < 1 && getType(args[0]) != 'function') {
                throw new Error('the frist argument must be function in call method');
            }
            this.dispatch(function (thunkDispatch, thunkGetstate) {
                args[0].apply(new ImCursor(thunkDispatch, thunkGetstate, _this.actionType), args.slice(1, args.length));
            });
        }
    }, {
        key: 'commit',
        value: function commit(actionType) {
            var thisActionType = actionType || this.actionType;
            this.dispatch({
                type: thisActionType,
                data: this.actions.root
            });
            this.clear();
        }
    }, {
        key: 'getState',
        value: function getState(func) {
            return func(this.getstate());
        }
    }]);

    return ImCursor;
}();

function createReducer(actionType, defaultState) {
    return function () {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
        var action = arguments[1];

        if (action.type == actionType) {
            var newState = state;
            newState = calAction(newState, action.data);
            return newState;
        } else return state;
    };
}

function bindActionCreators(actions, dispatch, actionType) {
    var newActions = {};
    Object.keys(actions).forEach(function (key) {
        newActions[key] = function () {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            dispatch(function (thunkDispatch, getstate) {
                actions[key].apply(new ImCursor(thunkDispatch, getstate, actionType), args);
            });
        };
    });
    return newActions;
}

exports.createReducer = createReducer;
exports.bindActionCreators = bindActionCreators;
