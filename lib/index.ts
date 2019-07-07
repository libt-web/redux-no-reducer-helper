interface valueTree {
    __value__?: any,
    [propName: string]: any,
    [propName: number]: any,
}

type reduxDispatch = (action: reduxAction | reduxThunkFunc) => void;

type reduxThunkFunc = (dispatch: reduxDispatch, getstate: () => any) => void;

type forkFunciton = (tools: forkTools, ...args: any[]) => void;

interface reduxAction {
    type: string,
    [propName: string]: any,
}


interface cursorInjectOjb {
    [propName: string]: any,
}

interface forkTools {
    set: (path: string, value: any) => void,
    update: (path: string, func: (old: any) => any) => void,
    inject: (obj: cursorInjectOjb) => void,
}

interface actionFunctions {
    [propName: string]: (this: ImCursor, ...args: any[]) => void,
}

type reducerFucntion = (state: any, action: reduxAction) => any;

interface ObjectConstructor2 extends ObjectConstructor {
    assign: (target: any, ...source: any[]) => any,
}

function getType(obj: Object): string {
    return Object.prototype.toString.call(obj).replace(/(\[object\W+|\])/g, '').toLowerCase();
}

function copyObj(obj: Object | Array<any>) {
    let newData: Object = {};
    if (getType(obj) == 'object') {
        newData = (<ObjectConstructor2>Object).assign({}, obj);
    } else if (getType(obj) == 'array') {
        newData = (<ObjectConstructor2>Object).assign([], obj);
    } else {
        throw new Error(`can not use this action in this type: ${obj}`);
    }
    return newData;
}
function calAction(oldValue: Object, path: valueTree) {
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
function getPath(str: string): string[] {
    return str.split('/');
}

class PathTree {
    root: valueTree;
    public constructor() {
        this.root = {};
    }
    public setNewNode(path: string[], value: any): void {
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
    public clear() {
        this.root = {};
    }
}



class ImCursor {
    dispatch: reduxDispatch
    getstate: () => any;
    actionType: string;
    rootPath: string[];
    actions: PathTree;
    public constructor(dispatch: reduxDispatch, getstate: () => any, actionType: string) {
        this.dispatch = dispatch;
        this.getstate = getstate;
        this.actionType = actionType;
        this.rootPath = [];
        this.actions = new PathTree();
    }
    public setRoot = (pathStr: string) => {
        if (pathStr === undefined) {
            this.rootPath = [];
            return;
        }
        this.rootPath = getPath(pathStr);
        return this;
    }
    public set = (pathStr: string, value: any) => {
        this.actions.setNewNode(this.rootPath.concat(getPath(pathStr)), value);
        return this;
    }
    public inject = (obj: cursorInjectOjb) => {
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

    public update = (pathStr: string, value: (old: any) => any) => {
        this.actions.setNewNode(this.rootPath.concat(getPath(pathStr)), value);
        return this;
    }

    public clear = () => {
        this.actions.clear();
        return this;
    }

    public fork = (func: forkFunciton, ...forkArgs: any[]) => {
        if (getType(func) != 'function') {
            throw new Error('the frist argument must be function in fork method');
        }
        const ref: forkTools = {
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
        func.apply(this, [ref, forkArgs]);
        return this;
    }

    public call = (func: (this: ImCursor, ...args: any[]) => void, ...callArgs: any[]) => {
        if (getType(func) != 'function') {
            throw new Error('the frist argument must be function in call method');
        }
        this.dispatch((thunkDispatch: reduxDispatch, thunkGetstate: () => any) => {
            func.apply(new ImCursor(thunkDispatch, thunkGetstate, this.actionType), callArgs);
        });
    }

    public commit = (actionType: string) => {
        const thisActionType = actionType || this.actionType;
        this.dispatch({
            type: thisActionType,
            data: this.actions.root
        });
        this.clear();
    }

    public getState = (func: (state: any) => any) => {
        return func(this.getstate());
    }
}



export function createReducer(actionType: string, defaultState: any): reducerFucntion {
    return (state = defaultState, action) => {
        if (action.type == actionType) {
            let newState = state;
            newState = calAction(newState, action.data);
            return newState;
        } else return state;
    };
}



export function bindActionCreators(actions: actionFunctions, dispatch: reduxDispatch, actionType: string) {
    const newActions: actionFunctions = {};
    Object.keys(actions).forEach((key) => {
        newActions[key] = (...args: any[]) => {
            dispatch((thunkDispatch, getstate) => {
                actions[key].apply(new ImCursor(thunkDispatch, getstate, actionType), args);
            });
        };
    });
    return newActions;
}
