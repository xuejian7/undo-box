"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UndoBox {
    constructor(vm) {
        this.vm = vm;
        // 撤销类型栈
        this.undo_key_stack = [];
        // 重做类型栈
        this.redo_key_stack = [];
        // watch_id key map
        this.id_key_dict = {};
        // box信息
        this.box_info = {};
    }
    /**
     * 添加监听数据
     */
    add({ key, callback = ({}) => {
    }, auto_handle_data = true }) {
        this.box_info[key] = {
            undo_stack: [JSON.stringify(this.vm.$data[key])],
            redo_stack: [],
            callback,
            auto_handle_data,
            unwatch: () => {
            }
        };
        this.watch(key);
    }
    /**
     * 撤销
     */
    undo() {
        if (typeof this.undo_key_stack === "undefined"
            ||
                this.undo_key_stack === null
            ||
                this.undo_key_stack.length === 0) {
            return;
        }
        let snapshot_key = this.undo_key_stack.pop();
        this.redo_key_stack.push(snapshot_key);
        let snapshot_record = this.box_info[snapshot_key].undo_stack.pop();
        if (snapshot_record === undefined)
            return;
        this.box_info[snapshot_key].redo_stack.push(snapshot_record);
        let data = JSON.parse(this.box_info[snapshot_key].undo_stack[this.box_info[snapshot_key].undo_stack.length - 1]);
        this.unwatch(snapshot_key);
        this.defaultHandle(snapshot_key, data);
        this.watch(snapshot_key);
    }
    /**
     * 重做
     */
    redo() {
        if (typeof this.redo_key_stack === "undefined"
            ||
                this.redo_key_stack === null
            ||
                this.redo_key_stack.length === 0) {
            return;
        }
        let snapshot_key = this.redo_key_stack.pop();
        this.undo_key_stack.push(snapshot_key);
        let pop = this.box_info[snapshot_key].redo_stack.pop();
        if (pop === undefined)
            return;
        this.box_info[snapshot_key].undo_stack.push(pop);
        let data = JSON.parse(pop);
        this.unwatch(snapshot_key);
        this.defaultHandle(snapshot_key, data);
        this.watch(snapshot_key);
    }
    /**
     * 开始监听
     * @param key
     */
    watch(key) {
        this.box_info[key].unwatch =
            this.vm.$watch(key, (val) => {
                let key = this.id_key_dict[val.__ob__.dep.id];
                this.take_snapshot(key, val);
            }, {
                deep: true
            });
        this.id_key_dict[this.vm.$data[key].__ob__.dep.id] = key;
    }
    /**
     * 手动记录快照
     * @param key
     * @param data
     */
    take_snapshot(key, data) {
        this.undo_key_stack.push(key);
        this.box_info[key].undo_stack.push(JSON.stringify(data));
        this.redo_key_stack = [];
        for (key in this.box_info) {
            this.box_info[key].redo_stack = [];
        }
    }
    /**
     * 停止监听
     * @param key
     */
    unwatch(key) {
        this.box_info[key].unwatch();
    }
    /**
     * 默认处理数据方法
     * @param key
     * @param data
     * @private
     */
    defaultHandle(key, data) {
        if (this.box_info[key].auto_handle_data) {
            this.vm.$set(this.vm, key, data);
        }
        this.box_info[key].callback(data);
    }
}
exports.default = UndoBox;
