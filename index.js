'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getType(obj) {
    return Object.prototype.toString.call(obj).replace(/(\[object\W+|\])/g, '').toLowerCase();
}
function copyObj(obj) {
    var newData = {};
    if (getType(obj) == 'object') {
        newData = Object.assign({}, obj);
    }
    else if (getType(obj) == 'array') {
        newData = Object.assign([], obj);
    }
    else {
        throw new Error("can not use this action in this type: " + obj);
    }
    return newData;
}
function calAction(oldValue, path) {
    if (path.__value__ !== undefined) { // 路径到达，更新数据
        if (getType(path.__value__) == 'function') {
            return path.__value__(oldValue);
        }
        return path.__value__;
    }
    else { // 复制更新路径中经历的数据节点
        var newData_1 = copyObj(oldValue);
        Object.keys(path).forEach(function (key) {
            newData_1[key] = calAction(oldValue[key], path[key]);
        });
        return newData_1;
    }
}
function getPath(str) {
    return str.split('/');
}
var PathTree = /** @class */ (function () {
    function PathTree() {
        this.root = {};
    }
    PathTree.prototype.setNewNode = function (path, value) {
        var cursor = this.root;
        path.forEach(function (key, i) {
            if (cursor[key] === undefined) {
                if (i < path.length - 1) {
                    cursor[key] = {};
                }
                else {
                    cursor[key] = { __value__: value === undefined ? null : value };
                }
            }
            else if (i >= path.length - 1) {
                cursor[key].__value__ = value === undefined ? null : value;
            }
            cursor = cursor[key];
        });
    };
    PathTree.prototype.clear = function () {
        this.root = {};
    };
    return PathTree;
}());
var ImCursor = /** @class */ (function () {
    function ImCursor(dispatch, getstate, actionType) {
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
                if (typeof (item) == 'function') {
                    _this.update(key, item);
                }
                else {
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
        this.fork = function (func) {
            var forkArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                forkArgs[_i - 1] = arguments[_i];
            }
            if (getType(func) != 'function') {
                throw new Error('the frist argument must be function in fork method');
            }
            var ref = {
                set: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    _this.set.apply(_this, args);
                    return ref;
                },
                update: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    _this.update.apply(_this, args);
                    return ref;
                },
                inject: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    _this.inject.apply(_this, args);
                    return ref;
                }
            };
            func.apply(_this, [ref, forkArgs]);
            return _this;
        };
        this.call = function (func) {
            var callArgs = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                callArgs[_i - 1] = arguments[_i];
            }
            if (getType(func) != 'function') {
                throw new Error('the frist argument must be function in call method');
            }
            _this.dispatch(function (thunkDispatch, thunkGetstate) {
                func.apply(new ImCursor(thunkDispatch, thunkGetstate, _this.actionType), callArgs);
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
        this.dispatch = dispatch;
        this.getstate = getstate;
        this.actionType = actionType;
        this.rootPath = [];
        this.actions = new PathTree();
    }
    return ImCursor;
}());
function createReducer(actionType, defaultState) {
    return function (state, action) {
        if (state === void 0) { state = defaultState; }
        if (action.type == actionType) {
            var newState = state;
            newState = calAction(newState, action.data);
            return newState;
        }
        else
            return state;
    };
}
function bindActionCreators(actions, dispatch, actionType) {
    var newActions = {};
    Object.keys(actions).forEach(function (key) {
        newActions[key] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
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
