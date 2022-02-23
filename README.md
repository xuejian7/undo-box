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
   1. 自动处理数据

        ```js
        export default {
            name: "index",
            data() {
                return {
                    // 需要撤销功能的数据
                    need_undo_data: {},
                    // 撤销工具
                    undoUtil: null
                }
            },
            mounted() {
                // 获取撤销工具
                this.undoUtil = this.$undoBox({key: 'need_undo_data'})
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
   
   2. 手动处理数据

      ```js
      export default {
          name: "index",
          data() {
              return {
                  // 需要撤销功能的数据
                  need_undo_data: {},
                  // 撤销工具
                  undoUtil: null
              }
          },
          mounted() {
              // 获取撤销工具
              this.undoUtil = this.$undoBox({
                key: 'need_undo_data',
                autoHandleData: false,
                callback: (data) => {
                  this.customHandleData(data)
                }
              })
          },
          methods: {
            	customHandleData(data){
                	/** TODO 自定义处理数据 **/
              },
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

### 4. undoBox参数

- `key` - （必填）所需监听数据的字段名称

- `autoBox` - （选填，默认为 true）是否自动开始监听

- `autoHandleData` - （选填，默认为 true）是否自动处理数据。默认使用Vue.set()赋值

- `callback` - （选填，默认为空方法）撤回、重做回调方法

  入参：

  -  `data` - 当前撤销、重做后应得的结果

