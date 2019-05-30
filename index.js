'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

var ImCursor = function ImCursor(dispatch, getstate, actionType) {
    _classCallCheck(this, ImCursor);

    _initialiseProps.call(this);

    this.dispatch = dispatch;
    this.getstate = getstate;
    this.actionType = actionType;
    this.rootPath = [];
    this.actions = new PathTree();
};

var _initialiseProps = function _initialiseProps() {
    var _this = this;

    this.setRoot = function (pathStr) {
        if (pathStr === undefined) {
            _this.rootPath = [];
            return;
        }
        _this.rootPath = getPath(pathStr);
        return _this;
    };

    this.set = function (pathStr, value) {
        _this.actions.setNewNode(_this.rootPath.concat(getPath(pathStr)), value);
        return _this;
    };

    this.inject = function (obj) {
        var keys = Object.keys(obj);
        keys.forEach(function (key) {
            var item = obj[key];
            if (typeof item == 'function') {
                _this.update(key, item);
            } else {
                _this.set(key, item);
            }
        });
        return _this;
    };

    this.update = function (pathStr, value) {
        _this.actions.setNewNode(_this.rootPath.concat(getPath(pathStr)), value);
        return _this;
    };

    this.clear = function () {
        _this.actions.clear();
        return _this;
    };

    this.fork = function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        if (args.length < 1 && getType(args[0]) != 'function') {
            throw new Error('the frist argument must be function in fork method');
        }
        var ref = {
            set: function set() {
                for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    args[_key3] = arguments[_key3];
                }

                _this.set.apply(_this, args);
                return ref;
            },
            update: function update() {
                for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                    args[_key4] = arguments[_key4];
                }

                _this.update.apply(_this, args);
                return ref;
            },
            inject: function inject() {
                for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                    args[_key5] = arguments[_key5];
                }

                _this.inject.apply(_this, args);
                return ref;
            }
        };
        args[0].apply(_this, [ref].concat(_toConsumableArray(args.slice(1, args.length))));
        return _this;
    };

    this.call = function () {
        for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
            args[_key6] = arguments[_key6];
        }

        if (args.length < 1 && getType(args[0]) != 'function') {
            throw new Error('the frist argument must be function in call method');
        }
        _this.dispatch(function (thunkDispatch, thunkGetstate) {
            args[0].apply(new ImCursor(thunkDispatch, thunkGetstate, _this.actionType), args.slice(1, args.length));
        });
    };

    this.commit = function (actionType) {
        var thisActionType = actionType || _this.actionType;
        _this.dispatch({
            type: thisActionType,
            data: _this.actions.root
        });
        _this.clear();
    };

    this.getState = function (func) {
        return func(_this.getstate());
    };
};

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
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            dispatch(function (thunkDispatch, getstate) {
                actions[key].apply(new ImCursor(thunkDispatch, getstate, actionType), args);
            });
        };
    });
    return newActions;
}

exports.bindActionCreators = bindActionCreators;
exports.createReducer = createReducer;
