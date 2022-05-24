import Vue from "vue";

interface UndoBoxItem {
    // uuid
    uuid: string
    // key
    key: string
    // vm
    vm: Vue
    // 撤销栈
    undo_stack: Array<string>
    // 重做栈
    redo_stack: Array<string>
    // unwatch方法
    unwatch: () => void
    // 回调
    callback: ({}) => void
    // 处理数据策略
    handle_data_strategy: HandleDataStrategy
    // 记录快照策略
    snapshot_strategy: SnapshotStrategy
}

export enum SnapshotStrategy {
    AUTO = 'AUTO',
    MANUAL = 'MANUAL'
}

export enum HandleDataStrategy {
    AUTO = 'AUTO',
    MANUAL = 'MANUAL'
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
        private size: number = 100
    ) {
    }

    /**
     * 添加监听数据
     */
    public add(
        {
            uuid = '',
            vm,
            key,
            callback = ({}) => {
            },
            handle_data_strategy = HandleDataStrategy.AUTO,
            snapshot_strategy = SnapshotStrategy.AUTO
        }: {
            uuid: string,
            vm: Vue,
            key: string,
            callback: ({}) => void,
            handle_data_strategy: HandleDataStrategy
            snapshot_strategy: SnapshotStrategy
        }
    ) {
        this.box_info[UndoBox.uuid$key(uuid, key)] = {
            uuid,
            key,
            vm: vm,
            // @ts-ignore
            undo_stack: [JSON.stringify(vm[key])],
            redo_stack: [],
            callback,
            handle_data_strategy,
            unwatch: () => {
            },
            snapshot_strategy
        }
        if (snapshot_strategy === SnapshotStrategy.AUTO) {
            this.watch(key, uuid)
        }
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
        this.handle(snapshot_key, data)

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
        this.handle(snapshot_key, data)
    }

    /**
     * 开始监听
     * @param key
     * @param uuid
     */
    public watch(key: string, uuid: string = '') {
        let uKey = UndoBox.uuid$key(uuid, key)
        this.box_info[uKey].unwatch =
            this.box_info[uKey].vm.$watch(key,
                (val) => {
                    let uKey = this.id_key_dict[val.__ob__.dep.id]
                    this.take_snapshot(this.box_info[uKey].key, this.box_info[uKey].uuid, val)
                },
                {
                    deep: true
                })

        if (Object.values(this.id_key_dict).includes(uKey)) {
            let useLessKey: number = Number.parseInt(Object.entries(this.id_key_dict).filter((entry) => entry[1] === uKey)[0][0])
            delete this.id_key_dict[useLessKey]
        }
        // 可接收data computed
        // @ts-ignore
        this.id_key_dict[this.box_info[uKey].vm[key].__ob__.dep.id] = uKey
    }

    /**
     * 手动记录快照
     * @param key
     * @param uuid
     * @param data
     */
    // @ts-ignore
    public take_snapshot(key: string, uuid: string = '', data: any = this.box_info[UndoBox.uuid$key(uuid, key)].vm[key]) {
        if (this.undo_key_stack.length >= this.size) {
            let first_key = this.undo_key_stack.splice(0, 1)[0]
            this.box_info[first_key].undo_stack.splice(0, 1)
        }

        let uKey = UndoBox.uuid$key(uuid, key)
        let json = JSON.stringify(data)
        if (json === this.box_info[uKey].undo_stack[this.box_info[uKey].undo_stack.length - 1]) {
            // 两次记录相同跳过
            return
        }
        this.undo_key_stack.push(uKey)
        this.box_info[uKey].undo_stack.push(json)
        this.redo_key_stack = []
        for (key in this.box_info) {
            this.box_info[key].redo_stack = []
        }
    }

    /**
     * 停止监听
     * @param key
     * @param uuid
     */
    public unwatch(key: string, uuid: string = '') {
        let uKey = UndoBox.uuid$key(uuid, key)
        this.box_info[uKey].unwatch()
    }

    /**
     * 手动记录快照并重新监听
     * @param key
     * @param uuid
     * @param data
     */
    // @ts-ignore
    public take_snapshot_and_watch(key: string, uuid: string = '', data: any = this.box_info[UndoBox.uuid$key(uuid, key)].vm[key]) {
        this.take_snapshot(key, uuid, data)
        this.watch(key, uuid)
    }

    /**
     * 处理数据方法
     * @param uKey
     * @param data
     * @private
     */
    private handle(uKey: string, data: any) {
        if (this.box_info[uKey].snapshot_strategy === SnapshotStrategy.AUTO) {
            this.unwatch(this.box_info[uKey].key, this.box_info[uKey].uuid)
        }

        this.defaultHandle(uKey, data)

        if (this.box_info[uKey].snapshot_strategy === SnapshotStrategy.AUTO) {
            this.watch(this.box_info[uKey].key, this.box_info[uKey].uuid)
        }
    }

    /**
     * 默认处理数据方法
     * @param uKey
     * @param data
     * @private
     */
    private defaultHandle(uKey: string, data: any) {
        if (this.box_info[uKey].handle_data_strategy === HandleDataStrategy.AUTO) {
            this.box_info[uKey].vm.$set(this.box_info[uKey].vm, this.box_info[uKey].key, data)
        }
        this.box_info[uKey].callback(data)
    }

    private static uuid$key(uuid: string, key: string) {
        return uuid + '$' + key
    }

}

