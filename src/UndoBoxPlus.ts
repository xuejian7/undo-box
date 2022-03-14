import Vue from "vue";

export default class UndoBoxPlus {

    // 撤销类型栈
    private undo_key_stack: Array<string> = []
    // 重做类型栈
    private redo_key_stack: Array<string> = []
    // 撤销栈目录
    private undo_stack_category: { [key: string]: Array<string> } = {}
    // 重做栈目录
    private redo_stack_category: { [key: string]: Array<string> } = {}
    // 额外信息
    private watch_list: { [key: string]: any } = {}
    // watch_id key map
    private id_key_dict: { [id: number]: string } = {}


    constructor(
        private vm: Vue
    ) {
    }

    /**
     * 添加监听数据
     */
    public add(
        {
            key
        }: {
            key: string
        }
    ) {
        this.undo_stack_category[key] = []
        this.redo_stack_category[key] = []

        this.undo_stack_category[key].push(
            JSON.stringify(this.vm.$data[key])
        )
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
        let snapshot_record = this.undo_stack_category[snapshot_key].pop()
        if (snapshot_record === undefined) return;
        this.redo_stack_category[snapshot_key].push(snapshot_record)

        let data = JSON.parse(this.undo_stack_category[snapshot_key][this.undo_stack_category[snapshot_key].length - 1])
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
        let pop = this.redo_stack_category[snapshot_key].pop()
        if (pop === undefined) return;
        this.undo_stack_category[snapshot_key].push(pop)
        let data = JSON.parse(pop)
        this.unwatch(snapshot_key)
        this.defaultHandle(snapshot_key, data)
        this.watch(snapshot_key)
    }

    public watch(key: string) {
        this.watch_list[key] = {
            unwatch: this.vm.$watch(key,
                (val) => {
                    let key = this.id_key_dict[val.__ob__.dep.id]
                    this.take_snapshot(key, val)

                },
                {
                    deep: true
                })
        }
        this.id_key_dict[this.vm.$data[key].__ob__.dep.id] = key
    }

    public take_snapshot(key: string, data: any) {
        this.undo_key_stack.push(key)
        this.undo_stack_category[key].push(JSON.stringify(data))
        this.redo_key_stack = []
        for (key in this.redo_stack_category) {
            this.redo_stack_category[key] = []
        }
    }

    public unwatch(key: string) {
        this.watch_list[key].unwatch()
    }

    private defaultHandle(key: string, data: any) {
        this.vm.$set(this.vm, key, data)
    }
}

