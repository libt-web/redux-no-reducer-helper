interface valueTree {
    __value__?: any;
    [propName: string]: any;
    [propName: number]: any;
}
declare type reduxDispatch = (action: reduxAction | reduxThunkFunc) => void;
declare type reduxThunkFunc = (dispatch: reduxDispatch, getstate: () => any) => void;
declare type forkFunciton = (tools: forkTools, ...args: any[]) => void;
interface reduxAction {
    type: string;
    [propName: string]: any;
}
interface cursorInjectOjb {
    [propName: string]: any;
}
interface forkTools {
    set: (path: string, value: any) => void;
    update: (path: string, func: (old: any) => any) => void;
    inject: (obj: cursorInjectOjb) => void;
}
interface actionFunctions {
    [propName: string]: (this: ImCursor, ...args: any[]) => void;
}
declare type reducerFucntion = (state: any, action: reduxAction) => any;
declare class PathTree {
    root: valueTree;
    constructor();
    setNewNode(path: string[], value: any): void;
    clear(): void;
}
declare class ImCursor {
    dispatch: reduxDispatch;
    getstate: () => any;
    actionType: string;
    rootPath: string[];
    actions: PathTree;
    constructor(dispatch: reduxDispatch, getstate: () => any, actionType: string);
    setRoot: (pathStr: string) => this;
    set: (pathStr: string, value: any) => this;
    inject: (obj: cursorInjectOjb) => this;
    update: (pathStr: string, value: (old: any) => any) => this;
    clear: () => this;
    fork: (func: forkFunciton, ...forkArgs: any[]) => this;
    call: (func: (this: ImCursor, ...args: any[]) => void, ...callArgs: any[]) => void;
    commit: (actionType: string) => void;
    getState: (func: (state: any) => any) => any;
}
export declare function createReducer(actionType: string, defaultState: any): reducerFucntion;
export declare function bindActionCreators(actions: actionFunctions, dispatch: reduxDispatch, actionType: string): actionFunctions;
export {};
