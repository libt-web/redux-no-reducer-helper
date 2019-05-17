## Redux no reducer Helper

### 特点

- 无需编写繁琐的reducer和定义多个action-type
- 依赖redux-thunk 插件，action可同步可异步
- 使用路径更新store树，更新沿途引用，实现 immutable 功能
- 兼容其他redux开发方式，可与其他reducer合并，并可以与其他reducer无缝对接

### 开始使用
1 安装

```
    npm install redux-no-reducer-helper
```
2 创建reducer
```javascript
    import { createReducer } from 'redux-no-reducer-helper'; // 引入创建reducer的方法
    export default createReducer('action-type',{ // action-type 为处理此reducer的action的统一标识
        count:0, // 初始化store数据
    });
```
3 创建redux store
``` javascript
    import { createStore, applyMiddleware, combineReducers } from 'redux'; // 引入redux相关
    import thunkMiddleware from 'redux-thunk'; // 引入redux-thunk 相关
    import reducers from '../reducers/index'; // 引入reducer

    const store=createStore(
        combineReducers(reducers), // 与其他普通reducer混和的总reducer对象
        {}, // 初始化状态，但是启动后会返回reducer中定义的状态
        applyMiddleware(thunkMiddleware) // 依赖与thunk 插件
    );

    export default store;
```
4 编写action
``` javascript
    export async function getCount(params){   // 异步action 
        const newCount=await getCountFromServer(params); // 调用服务器接口
        this.set('count',newCount); // 放入暂存区
        this.commit(); // 提交改动并合并到store
    }

    export function addCount(){ // 同步action
        this.update('count',old=>old+1); // 将更新函数放入暂存区
        this.commit(); // 提交改动，并将更新函数作用在响应路径下的值上，合并到store
    }

    export function resetCount(){ // 同步action
        this.set('count',0); // 放值
        this.commit(); // 提交
        this.call(getCount,params); // 启动其他action
    }
```

5 在react组件引用 store，action
```javascript
    import { connect } from 'react-redux'; 
    import { bindActionCreators } from 'redux-no-reducer-helper'; 
    import * as actions from '../action.js';

    @connect(
        state=>({store:state}),
        dispatch=>({actions:bindActionCreators(actions,dispatch,'action-type')}), // 将action 绑定到当前组件，action-type 为响应reducer 的 actionType
    )
    export default class View extends React.component{
        onClick=()=>{
            this.props.actions.addCount(); // 正常调用action
        }
    };
```

### API
action方法将会把this绑定到一个帮助器上（也是action运行期间的store数据暂存区），为action提供redux功能和帮助函数

``` javascript
    /* 向暂存区的相应path位置放置value
        path ：数据路径，用 / 隔开的字符串，例如：'a/b/c' 对应store中的 {a:{b:{c:0}}} 中c位置
        value :放置的值，在提交后会合并到store的相应位置，并替换原值
    */
    this.set(path,value);
    
    /* 向暂存区的相应path位置放置更新函数
        path：同上
        func:纯同步函数，参数为store中path位置之前的值，函数需要返回新的值，在合并期间执行
    */
    this.update(path,func);

    /* 获取store中最新的值，相当于redux 的getstate
        func:参数为store的根节点，返回需要返回的值，例如 state=>state.a.b.c 则此函数返回c的值
    */
    this.getState(func)

    /* 设置暂存去通用路径，之后调用的set，或者update的paht只需要传入相对路径，具体的会自动补全
        path：同上
    */
    this.setRoot(path);

    /* 清空暂存区数据
    */
    this.clear();

    /* 提交暂存去数据，和store进行合并
        actionType：可选，不填时会将暂存区数据交给 bindActionCreators时填写的reducer actiontype执行，
        填写时将暂存区数据提交到谈些的reducer处理
     */
    this.commit(actionType)

    /**
     * obj为形如
     * {
     *  'path':value,
     *  'path1':value1,
     *  'path2':func1,
     * }的对象
     * 批量向暂存区的path位置放置value或放置update函数，path,value,func的约定参照set方法和update方法
    */
    this.inject(obj)

    /**
     * 调用func函数，并将args传递给func函数使用
     * func函数包含参数({set,update,inject},...args)
     * 前一个参数为提供给func使用的set,update,inject方法,
     * 之后的参数为透传的参数组成的数组
     * 
     * func函数中set，update,inject使用的暂存区和调用fork的anction的暂存区是同一个
     * 使用时注意pathroot 上下文
    */
    this.fork(func,...args)

    /**
     * 启动一个其他的action 函数，并将args附加参数传递给新action使用
     * action为函数，并绑定this到新暂存区，参数为透传的args
    */
    this.call(action,...args)

```

### 示例代码
[GitHub](https://github.com/TWOWhite/redux-no-reducer-helper-example)