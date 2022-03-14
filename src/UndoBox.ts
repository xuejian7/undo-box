import Vue from "vue";

interface UndoBoxItem {
    // 撤销栈
    undo_stack: Array<string>
    // 重做栈
    redo_stack: Array<string>
    // unwatch方法
    unwatch: () => void
    // 回调
    callback: ({}) => void
    // 是否自动处理数据
    auto_handle_data: boolean
}

export default class UndoBox {

    // 撤销类型栈
    private undo_key_stack: Array<string> = []
    // 重做类型栈
    private redo_key_stack: Array<string> = []
    // watch_id key map
    private id_key_dict: { [id: number]: string } = {}
    // box信息
    private box_info: { [key: string]: UndoBoxItem } = {}

    constructor(
        private vm: Vue
    ) {
    }

    /**
     * 添加监听数据
     */
    public add(
        {
            key,
            callback = ({}) => {
            },
            auto_handle_data = true
        }: {
            key: string,
            callback: ({}) => void,
            auto_handle_data: boolean
        }
    ) {
        this.box_info[key] = {
            undo_stack: [JSON.stringify(this.vm.$data[key])],
            redo_stack: [],
            callback,
            auto_handle_data,
            unwatch: () => {
            }
        }
        this.watch(key)
    }

    /**
     * 撤销
     */
    public undo() {
        if (
            typeof this.undo_key_stack === "undefined"
            ||
            this.undo_key_stack === null
            ||
            this.undo_key_stack.length === 0
        ) {
            return
        }

        let snapshot_key: any = this.undo_key_stack.pop()
        this.redo_key_stack.push(snapshot_key)
        let snapshot_record = this.box_info[snapshot_key].undo_stack.pop()
        if (snapshot_record === undefined) return;
        this.box_info[snapshot_key].redo_stack.push(snapshot_record)

        let data = JSON.parse(this.box_info[snapshot_key].undo_stack[this.box_info[snapshot_key].undo_stack.length - 1])
        this.unwatch(snapshot_key)
        this.defaultHandle(snapshot_key, data)
        this.watch(snapshot_key)

    }

    /**
     * 重做
     */
    public redo() {
        if (
            typeof this.redo_key_stack === "undefined"
            ||
            this.redo_key_stack === null
            ||
            this.redo_key_stack.length === 0
        ) {
            return
        }

        let snapshot_key: any = this.redo_key_stack.pop()
        this.undo_key_stack.push(snapshot_key)
        let pop = this.box_info[snapshot_key].redo_stack.pop()
        if (pop === undefined) return;
        this.box_info[snapshot_key].undo_stack.push(pop)
        let data = JSON.parse(pop)
        this.unwatch(snapshot_key)
        this.defaultHandle(snapshot_key, data)
        this.watch(snapshot_key)
    }

    /**
     * 开始监听
     * @param key
     */
    public watch(key: string) {
        this.box_info[key].unwatch =
            this.vm.$watch(key,
                (val) => {
                    let key = this.id_key_dict[val.__ob__.dep.id]
                    this.take_snapshot(key, val)

                },
                {
                    deep: true
                })

        this.id_key_dict[this.vm.$data[key].__ob__.dep.id] = key
    }

    /**
     * 手动记录快照
     * @param key
     * @param data
     */
    public take_snapshot(key: string, data: any) {
        this.undo_key_stack.push(key)
        this.box_info[key].undo_stack.push(JSON.stringify(data))
        this.redo_key_stack = []
        for (key in this.box_info) {
            this.box_info[key].redo_stack = []
        }
    }

    /**
     * 停止监听
     * @param key
     */
    public unwatch(key: string) {
        this.box_info[key].unwatch()
    }

    /**
     * 默认处理数据方法
     * @param key
     * @param data
     * @private
     */
    private defaultHandle(key: string, data: any) {
        if (this.box_info[key].auto_handle_data) {
            this.vm.$set(this.vm, key, data)
        }
        this.box_info[key].callback(data)
    }
}

