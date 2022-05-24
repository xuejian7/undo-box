"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleDataStrategy = exports.SnapshotStrategy = void 0;
var SnapshotStrategy;
(function (SnapshotStrategy) {
    SnapshotStrategy["AUTO"] = "AUTO";
    SnapshotStrategy["MANUAL"] = "MANUAL";
})(SnapshotStrategy = exports.SnapshotStrategy || (exports.SnapshotStrategy = {}));
var HandleDataStrategy;
(function (HandleDataStrategy) {
    HandleDataStrategy["AUTO"] = "AUTO";
    HandleDataStrategy["MANUAL"] = "MANUAL";
})(HandleDataStrategy = exports.HandleDataStrategy || (exports.HandleDataStrategy = {}));
class UndoBox {
    constructor(size = 100) {
        this.size = size;
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
    add({ vm, key, callback = ({}) => {
    }, handle_data_strategy = HandleDataStrategy.AUTO, snapshot_strategy = SnapshotStrategy.AUTO }) {
        this.box_info[key] = {
            vm: vm,
            undo_stack: [JSON.stringify(vm.$data[key])],
            redo_stack: [],
            callback,
            handle_data_strategy,
            unwatch: () => {
            },
            snapshot_strategy
        };
        if (snapshot_strategy === SnapshotStrategy.AUTO) {
            this.watch(key);
        }
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
        this.handle(snapshot_key, data);
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
        this.handle(snapshot_key, data);
    }
    /**
     * 开始监听
     * @param key
     */
    watch(key) {
        this.box_info[key].unwatch =
            this.box_info[key].vm.$watch(key, (val) => {
                let key = this.id_key_dict[val.__ob__.dep.id];
                this.take_snapshot(key, val);
            }, {
                deep: true
            });
        if (Object.values(this.id_key_dict).includes(key)) {
            let useLessKey = Number.parseInt(Object.entries(this.id_key_dict).filter((entry) => entry[1] === key)[0][0]);
            delete this.id_key_dict[useLessKey];
        }
        // 可接收data computed
        // @ts-ignore
        this.id_key_dict[this.box_info[key].vm[key].__ob__.dep.id] = key;
    }
    /**
     * 手动记录快照
     * @param key
     * @param data
     */
    take_snapshot(key, data) {
        if (this.undo_key_stack.length >= this.size) {
            let first_key = this.undo_key_stack.splice(0, 1)[0];
            this.box_info[first_key].undo_stack.splice(0, 1);
        }
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
     * 处理数据方法
     * @param key
     * @param data
     * @private
     */
    handle(key, data) {
        if (this.box_info[key].snapshot_strategy === SnapshotStrategy.AUTO) {
            this.unwatch(key);
        }
        this.defaultHandle(key, data);
        if (this.box_info[key].snapshot_strategy === SnapshotStrategy.AUTO) {
            this.watch(key);
        }
    }
    /**
     * 默认处理数据方法
     * @param key
     * @param data
     * @private
     */
    defaultHandle(key, data) {
        if (this.box_info[key].handle_data_strategy === HandleDataStrategy.AUTO) {
            this.box_info[key].vm.$set(this.box_info[key].vm, key, data);
        }
        this.box_info[key].callback(data);
    }
}
exports.default = UndoBox;
