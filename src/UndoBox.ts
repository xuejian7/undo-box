import Vue from "vue";
import Type from "./UndoBoxType";

class UndoBox {
    // 撤销栈
    private undo_stack: Array<string> = []
    // 重做栈
    private redo_stack: Array<string> = []
    // 冻结计数
    private freeze: number = 0
    // 运行状态
    private running: boolean = false
    // 停止监听方法
    private unwatch: (() => void) = () => {
        throw new Error('unwatch is undefined')
    }
    // 所监听的data key
    private readonly key: string
    // vm实例
    private readonly _vm: Vue
    // undo-box 类型
    private readonly type: Type
    // 操作相关
    private readonly callback: (data: {}) => void
    private readonly autoHandleData: boolean

    constructor(
        {
            key,
            type = Type.AUTO,
            autoBox = true,
            autoHandleData = true,
            callback = (data: {}) => {
            },
            vm
        }: {
            key: string,
            type?: Type,
            autoBox?: boolean,
            autoHandleData?: boolean,
            callback?: (data: {}) => void,
            vm: Vue
        }
    ) {
        this.key = key;
        this._vm = vm
        this.type = type
        this.autoHandleData = autoHandleData
        this.callback = callback
        if (autoBox) {
            this.box()
        }
    }

    /**
     * 重置数据
     * @private
     */
    private _reset(): void {
        this.undo_stack = []
        this.redo_stack = []
        this.freeze = 0
        this.running = false
    }

    /**
     * 开始监听
     */
    public box() {
        if (this.running) {
            return
        }

        this._reset()
        this.undo_stack.push(JSON.stringify(this._vm.$data[this.key]))
        this.running = true

        if (this.type === Type.MANUAL) {
            return;
        }
        this.unwatch = this._vm.$watch(this.key,
            (val) => {
                if (this.freeze > 0) {
                    this.freeze--
                    return;
                }

                this.undo_stack.push(JSON.stringify(val))
                this.redo_stack = []

            },
            {
                deep: true
            })
    }

    public record(){
        if (this.type === Type.AUTO) {
            return
        }
        this.undo_stack.push(JSON.stringify(this._vm.$data[this.key]))
    }

    /**
     * 停止监听
     */
    public unbox(): void {
        this._reset()
        this.unwatch()
    }

    /**
     * 撤销
     */
    public undo(): void {
        if (typeof this.undo_stack === "undefined" || this.undo_stack === null || this.undo_stack.length <= 1) {
            return
        }
        if (this.type === Type.AUTO) {
            this.freeze++
        }
        let pop = this.undo_stack.pop()
        if (pop == undefined) {
            return;
        }
        this.redo_stack.push(pop)
        let data = JSON.parse(this.undo_stack[this.undo_stack.length - 1])
        this.defaultHandle(data)
    }

    /**
     * 重做
     */
    public redo(): void {
        if (typeof this.redo_stack === "undefined" || this.redo_stack === null || this.redo_stack.length === 0) {
            return
        }
        if (this.type === Type.AUTO) {
            this.freeze++
        }
        let pop = this.redo_stack.pop()
        if (pop === undefined) {
            return;
        }
        this.undo_stack.push(pop)
        let data = JSON.parse(pop)
        this.defaultHandle(data)
    }

    /**
     * 默认行为
     * @param data
     * @private
     */
    private defaultHandle(data: {}) {
        if (this.autoHandleData) {
            this.defaultHandleDataChange(data)
        }
        this.callback(data)
    }

    /**
     * 默认处理数据方法
     * @param data
     * @private
     */
    private defaultHandleDataChange(data: {}) {
        this._vm.$set(this._vm, this.key, data)
    }


}

export default UndoBox