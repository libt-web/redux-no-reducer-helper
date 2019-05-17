function getType(obj) {
    return Object.prototype.toString.call(obj).replace(/(\[object\W+|\])/g, '').toLowerCase();
}
function copyObj(obj) {
    let newData = {};
    if (getType(obj) == 'object') {
        newData = Object.assign({}, obj);
    } else if (getType(obj) == 'array') {
        newData = Object.assign([], obj);
    } else {
        throw new Error(`can not use this action in this type: ${obj}`);
    }
    return newData;
}
function calAction(oldValue, path) {
    if (path.__value__ !== undefined) { // 路径到达，更新数据
        if (getType(path.__value__) == 'function') {
            return path.__value__(oldValue);
        }
        return path.__value__;
    } else { // 复制更新路径中经历的数据节点
        const newData = copyObj(oldValue);
        Object.keys(path).forEach((key) => {
            newData[key] = calAction(oldValue[key], path[key]);
        });
        return newData;
    }
}
function getPath(str) {
    return str.split('/');
}
class PathTree {
    constructor() {
        this.root = {};
    }
    setNewNode(path, value) {
        let cursor = this.root;
        path.forEach((key, i) => {
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
    clear() {
        this.root = {};
    }
}
class ImCursor {
    constructor(dispatch, getstate, actionType) {
        this.dispatch = dispatch;
        this.getstate = getstate;
        this.actionType = actionType;
        this.rootPath = [];
        this.actions = new PathTree();
    }
    setRoot(pathStr) {
        if (pathStr === undefined) {
            this.rootPath = [];
            return;
        }
        this.rootPath = getPath(pathStr);
        return this;
    }
    set(pathStr, value) {
        this.actions.setNewNode(this.rootPath.concat(getPath(pathStr)), value);
        return this;
    }
    inject(obj) {
        const keys = Object.keys(obj);
        keys.forEach((key) => {
            const item = obj[key];
            if (typeof (item) == 'function') {
                this.update(key, item);
            } else {
                this.set(key, item);
            }
        });
        return this;
    }
    update(pathStr, value) {
        this.actions.setNewNode(this.rootPath.concat(getPath(pathStr)), value);
        return this;
    }
    clear() {
        this.actions.clear();
        return this;
    }
    fork(...args) {
        if (args.length < 1 && getType(args[0]) != 'function') {
            throw new Error('the frist argument must be function in fork method');
        }
        const ref = {
            set: (...args) => {
                this.set.apply(this, args);
                return ref;
            },
            update: (...args) => {
                this.update.apply(this, args);
                return ref;
            },
            inject: (...args) => {
                this.inject.apply(this, args);
                return ref;
            }
        };
        args[0].apply(this, [ref, ...args.slice(1, args.length)]);
        return this;
    }
    call(...args) {
        if (args.length < 1 && getType(args[0]) != 'function') {
            throw new Error('the frist argument must be function in call method');
        }
        this.dispatch((thunkDispatch, thunkGetstate) => {
            args[0].apply(new ImCursor(thunkDispatch, thunkGetstate, this.actionType), args.slice(1, args.length));
        });
    }
    commit(actionType) {
        const thisActionType = actionType || this.actionType;
        this.dispatch({
            type: thisActionType,
            data: this.actions.root
        });
        this.clear();
    }
    getState(func) {
        return func(this.getstate());
    }
}

export function createReducer(actionType, defaultState) {
    return (state = defaultState, action) => {
        if (action.type == actionType) {
            let newState = state;
            newState = calAction(newState, action.data);
            return newState;
        } else return state;
    };
}

export function bindActionCreators(actions, dispatch, actionType) {
    const newActions = {};
    Object.keys(actions).forEach((key) => {
        newActions[key] = (...args) => {
            dispatch((thunkDispatch, getstate) => {
                actions[key].apply(new ImCursor(thunkDispatch, getstate, actionType), args);
            });
        };
    });
    return newActions;
}
