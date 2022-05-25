## 使用方法

### 1. 安装 undo-box
    npm isntall undo-box
### 2. 注册Vue插件
```js
// 注册 Vue 插件，默认挂载 $undoBox
import undoBox from 'undo-box'
Vue.use(undoBox)

//或

//手动挂载到property，可自定义挂载名称
import {undoBox} from 'undo-box'
Vue.prototype.$dodoBox = undoBox
```
### 3. 在页面中使用undo-box
   1. 例：

        ```js
        export default {
            name: "index",
            data() {
                return {
                    // 需要撤销功能的数据
                    need_undo_data: {},
                    // 撤销工具
                    undoUtil: null,
                    instance_opts: {
                      
                    },
                  	add_opts: {
                      vm,
                      uuid,
                      key,
                      callback,
                      handle_data_strategy,
                      snapshot_strategy,
                    }
                }
            },
            mounted() {
                // 获取撤销工具
                this.undoUtil = this.this.$undoBox(this.instance_opts)
              	// 添加监听数据
              	this.undoUtil.add(this.add_opts)
            },
            methods: {
                undo() {
                    // 撤销方法
                    this.undoUtil.undo();
                },
                redo() {
                    // 重做方法
               this.undoUtil.redo()
           }
       }
      }
   ```
   
   2. 参数

        1. instance_opts

           - size: number - 撤回栈最大长度（默认值：100）

        2. add_opts

           - vm: Vue - 数据所在vm
           - uuid?: string - 如需监听多个相同key时，需指定uuid

           - Key: string - 所需监听数据的字段名称

           - callback?: ({}) => {} - 撤回、重做回调方法

             参数：

             -  data - 当前撤销、重做后应得的结果

           - handle_data_strategy?: HandleDataStrategy - 处理数据策略

             - HandleDataStrategy
               - AUTO - 自动处理数据，$set（默认值）
               - MANUAL - 手动处理数据，可callback中指定处理数据方法

           - snapshot_strategy?: SnapshotStrateg - 记录快照策略

             - SnapshotStrateg
               - AUTO - 监听数据，数据发生改变时自动记录快照（默认值）
               - MANUAL - take_snapshot(key: string, uuid?: string, data?: any)手动记录快照

        3. 其他方法

           - take_snapshot(key, uuid, data) - 手动记录快照
           - unwatch(key, uuid) - 停止监听
           - watch(key, uuid) - 开始监听
           - take_snapshot_and_watch(key, uuid, data) - 手动记录快照并开始监听
             - key: string - add_opts.key
             - uuid?: string - add_opts.uuid（可选）
             - data?: any - 当前值（可选）
